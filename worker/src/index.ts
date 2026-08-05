/**
 * Contact form backend.
 *
 * The destination address never reaches the browser — it lives in the
 * CONTACT_TO secret and is only read here. The public site only ever knows
 * this Worker's URL and the Turnstile *site* key (which is safe to publish).
 *
 * A submission has to clear four gates before an email is sent:
 *   1. Origin allowlist  — stops casual cross-site posting from a browser
 *   2. Honeypot field    — stops bots that fill every input they find
 *   3. Dwell timer       — stops bots that submit faster than a human can type
 *   4. Turnstile         — the real defence; verified server-side, single-use
 */

interface Env {
  TURNSTILE_SECRET_KEY: string
  RESEND_API_KEY: string
  CONTACT_TO: string
  CONTACT_FROM: string
  ALLOWED_ORIGINS: string
  RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> }
}

/** Nobody types a real message in under three seconds. */
const MIN_DWELL_MS = 3000
/** Turnstile tokens die after 300s anyway; a stale form is a re-submit. */
const MAX_DWELL_MS = 30 * 60 * 1000
const MAX_BODY_BYTES = 16 * 1024

const LIMITS = { name: 100, email: 254, message: 5000 } as const

type Submission = {
  name: string
  email: string
  message: string
  token: string
  /** ms between the form mounting and the user hitting submit */
  elapsed: number
  /** the honeypot — must be empty */
  company_website: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    const allowOrigin = allowed.includes(origin) ? origin : null

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: allowOrigin ? 204 : 403, headers: cors(allowOrigin) })
    }
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405, allowOrigin)
    }
    if (!allowOrigin) {
      return json({ error: 'forbidden_origin' }, 403, null)
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? ''

    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: ip || 'unknown' })
      if (!success) return json({ error: 'rate_limited' }, 429, allowOrigin)
    }

    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: 'too_large' }, 413, allowOrigin)
    }

    let body: Partial<Submission>
    try {
      body = JSON.parse(raw) as Partial<Submission>
    } catch {
      return json({ error: 'bad_json' }, 400, allowOrigin)
    }

    // Gate 2 + 3. Both answer with the same 200 a real submission gets: a bot
    // that learns *which* check caught it can trivially work around it.
    if (typeof body.company_website === 'string' && body.company_website.trim() !== '') {
      return json({ ok: true }, 200, allowOrigin)
    }
    const elapsed = Number(body.elapsed)
    if (!Number.isFinite(elapsed) || elapsed < MIN_DWELL_MS || elapsed > MAX_DWELL_MS) {
      return json({ ok: true }, 200, allowOrigin)
    }

    const name = str(body.name).slice(0, LIMITS.name)
    const email = str(body.email).slice(0, LIMITS.email)
    const message = str(body.message).slice(0, LIMITS.message)

    if (!name || !message || !isEmail(email)) {
      return json({ error: 'invalid_fields' }, 422, allowOrigin)
    }

    // Gate 4 — the one that actually matters.
    if (!(await verifyTurnstile(str(body.token), ip, env.TURNSTILE_SECRET_KEY))) {
      return json({ error: 'failed_challenge' }, 403, allowOrigin)
    }

    const sent = await sendEmail({ name, email, message }, env)
    if (!sent.ok) {
      console.error('email send failed', sent.detail)
      return json({ error: 'send_failed' }, 502, allowOrigin)
    }

    return json({ ok: true }, 200, allowOrigin)
  },
}

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  if (!token) return false

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  // Lets us retry a dropped request without the token counting as reused.
  form.append('idempotency_key', crypto.randomUUID())

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const outcome = (await res.json()) as { success: boolean; 'error-codes'?: string[] }
    if (!outcome.success) console.warn('turnstile rejected', outcome['error-codes'])
    return outcome.success === true
  } catch (err) {
    console.error('turnstile unreachable', err)
    return false
  }
}

async function sendEmail(
  msg: { name: string; email: string; message: string },
  env: Env,
): Promise<{ ok: true } | { ok: false; detail: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `thehugecompany contact form <${env.CONTACT_FROM}>`,
        to: [env.CONTACT_TO],
        // reply_to, not from — putting the visitor's address in From fails SPF
        // and DKIM for our domain and gets the whole domain marked as spam.
        // This way hitting Reply still goes back to them.
        reply_to: msg.email,
        subject: `Contact form — ${msg.name}`,
        text: `From: ${msg.name} <${msg.email}>\n\n${msg.message}\n`,
      }),
    })

    if (!res.ok) return { ok: false, detail: `${res.status} ${await res.text()}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, detail: String(err) }
  }
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function cors(allowOrigin: string | null): HeadersInit {
  if (!allowOrigin) return {}
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, allowOrigin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(allowOrigin) },
  })
}
