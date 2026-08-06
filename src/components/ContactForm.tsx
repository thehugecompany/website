import { useEffect, useRef, useState } from 'react'

/**
 * The contact form itself — no heading, no section wrapper, so it can be
 * dropped into any page. Pages supply their own surrounding layout.
 *
 * Three of the four anti-spam gates live here (honeypot, dwell timer,
 * Turnstile); the fourth and the real enforcement are in worker/src/index.ts.
 * Everything here is a hint to the Worker, never a decision — a bot can skip
 * this UI entirely and POST straight to the endpoint.
 */

type TurnstileOptions = {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  callback?: (token: string) => void
  'error-callback'?: (code: string) => boolean | void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement | string, opts: TurnstileOptions): string
      reset(widgetId?: string): void
      remove(widgetId?: string): void
    }
    onTurnstileLoad?: () => void
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad'

/** Module-level so React 19 strict-mode's double mount reuses one script tag. */
let scriptPromise: Promise<void> | null = null

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    window.onTurnstileLoad = () => resolve()
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onerror = () => {
      scriptPromise = null // let a later mount retry
      reject(new Error('turnstile script failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

const inputClass =
  'rounded-xl border border-paper/15 bg-paper/5 px-4 py-3 text-paper outline-none transition-colors placeholder:text-paper/25 focus:border-brand'

function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')

  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  // Gate 3: bots submit near-instantly. Stamped in the effect below rather than
  // at render, both because render must stay pure and because mount is the
  // moment the form actually became fillable.
  const mountedAtRef = useRef(0)

  useEffect(() => {
    mountedAtRef.current = Date.now()
    if (!SITE_KEY || !widgetRef.current) return
    let cancelled = false

    loadTurnstile()
      .then(() => {
        if (cancelled || !widgetRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(widgetRef.current, {
          sitekey: SITE_KEY,
          theme: 'dark',
          callback: (t) => setToken(t),
          'expired-callback': () => setToken(''),
          'timeout-callback': () => setToken(''),
          'error-callback': () => {
            setToken('')
            return true
          },
        })
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the verification widget.')
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        // Switching to the success view unmounts the container before this
        // runs, so Turnstile may already have dropped the widget itself.
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // already gone — nothing to clean up
        }
        widgetIdRef.current = null
      }
    }
  }, [])

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'sending') return

    if (!ENDPOINT) {
      setStatus('error')
      setError('The contact endpoint is not configured.')
      return
    }

    const data = new FormData(event.currentTarget)
    setStatus('sending')
    setError('')

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          company_website: data.get('company_website'),
          elapsed: Date.now() - mountedAtRef.current,
          token,
        }),
      })

      if (!res.ok) throw new Error(String(res.status))
      setStatus('sent')
    } catch {
      setStatus('error')
      setError('Something went wrong. Try again in a moment.')
      // Turnstile tokens are single-use — a retry needs a fresh one.
      setToken('')
      if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current)
    }
  }

  if (status === 'sent') {
    return (
      <p className="rounded-xl border border-brand/40 bg-brand/10 px-6 py-8 text-center">
        Message sent — we&apos;ll get back to you shortly.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-paper/60">
          Name
        </span>
        <input name="name" type="text" required autoComplete="name" maxLength={100} className={inputClass} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-paper/60">
          Email
        </span>
        <input name="email" type="email" required autoComplete="email" maxLength={254} className={inputClass} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-paper/60">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={5000}
          placeholder="We need help with..."
          className={`${inputClass} resize-y`}
        />
      </label>

      {/* Gate 2: the honeypot. Positioned off-screen rather than display:none —
          some bots skip hidden inputs, but almost none skip a positioned one.
          Kept out of the tab order and hidden from assistive tech so a human
          never encounters it. Any value at all means the Worker drops it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Do not fill this in</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div ref={widgetRef} className="min-h-[65px]" />

      {!SITE_KEY && (
        <p className="text-sm text-brand">
          VITE_TURNSTILE_SITE_KEY is unset — the form cannot be submitted.
        </p>
      )}
      {error && <p className="text-sm text-brand">{error}</p>}

      <button
        type="submit"
        disabled={status === 'sending' || !token}
        className="rounded-xl bg-paper px-7 py-3 text-base font-bold text-brand transition-colors hover:bg-brand hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-paper disabled:hover:text-brand md:text-lg"
      >
        {status === 'sending' ? 'Sending...' : 'Send message'}
      </button>
    </form>
  )
}

export default ContactForm
