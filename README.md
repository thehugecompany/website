# thehugecompany

Marketing site for [thehugecompany.net](https://thehugecompany.net) — a React + Vite SPA
deployed to GitHub Pages, with a contact form backed by a Cloudflare Worker.

## Stack

- **React 19** + **TypeScript**, built with **Vite**
- **Tailwind v4**, configured through `@theme` tokens in `src/index.css` (no `tailwind.config.js`)
- **react-router** in declarative mode
- **motion** for the navbar logo animation
- **Cloudflare Workers** for the contact form backend

Fonts (Bevan, JetBrains Mono) are self-hosted from `src/assets/fonts/`. Do not
swap these for Google Fonts or any other CDN — the woff2 files are committed
deliberately.

## Getting started

Requires Node 22 (matching CI).

```bash
npm install
cp .env.example .env      # then fill in real values, see Configuration
npm run dev
```

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | Typechecks all projects, builds to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |
| `npm run worker:dev` | Run the contact Worker locally on `:8787` |
| `npm run worker:deploy` | Deploy the Worker to Cloudflare |

## Layout

```
src/
  components/
    ContactForm.tsx   reusable form — no headings, drops into any page
    Navbar.tsx
    Footer.tsx
  pages/
    Home.tsx          landing page; embeds ContactForm under #contact
    Contact.tsx       the /contact route
  App.tsx             layout + <Routes>
  main.tsx            BrowserRouter, basename from import.meta.env.BASE_URL
worker/
  src/index.ts        contact form backend
  wrangler.toml       Worker config (deploy config only — see below)
```

Config lives at the repo root, not per subdirectory. `tsconfig.worker.json`
sits alongside `tsconfig.app.json` and `tsconfig.node.json` in the root
`tsconfig.json` references list, and the Worker's dependencies and scripts are
in the root `package.json`. One install, one lockfile.

Because the Worker is a project reference, `npm run build` typechecks it too —
a Worker type error will fail the site build.

## Contact form

The destination address never reaches the browser. It lives in a Worker secret
and is read only server-side; the client knows nothing but the Worker's URL and
the public Turnstile site key.

A submission clears four gates before any mail is sent:

1. **Origin allowlist** — CORS, blocks casual cross-site posting
2. **Honeypot** — an off-screen `company_website` field, out of the tab order and hidden from assistive tech
3. **Dwell timer** — rejects submissions faster than 3s after mount
4. **Cloudflare Turnstile** — verified server-side via siteverify; tokens are single-use

Plus a 5 request/minute per-IP rate limit.

Gates 2 and 3 return the same `200 {ok:true}` a real submission gets. This is
deliberate — a bot that learns *which* check caught it can work around it.

The dwell timer has no upper bound. A tab open for an hour is ordinary human
behaviour, not a bot signal, and replay is already covered by Turnstile's
single-use tokens.

Mail goes out through [Resend](https://resend.com). Only `sendEmail()` in
`worker/src/index.ts` knows about it, so switching providers means rewriting
one function. `Reply-To` carries the visitor's address — putting it in `From`
would fail SPF and DKIM for our domain and hurt deliverability.

## Configuration

### Public (client bundle)

These are inlined into the JS at build time and are safe to expose. Locally
they come from `.env`; in CI from **repository variables** (Settings → Secrets
and variables → Actions → **Variables** tab, *not* Secrets — `deploy.yml` reads
them as `vars.*`, and putting them under Secrets yields an empty value and a
silently broken form).

| Variable | Value |
|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Turnstile site key. `1x00000000000000000000AA` always passes, for local use |
| `VITE_CONTACT_ENDPOINT` | Worker URL. `http://localhost:8787` locally; the `workers.dev` URL in CI |

### Worker secrets

Never committed. Set with:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY -c worker/wrangler.toml
npx wrangler secret put RESEND_API_KEY       -c worker/wrangler.toml
npx wrangler secret put CONTACT_TO           -c worker/wrangler.toml
```

`wrangler secret list` shows names only — values can never be read back, only
overwritten. For local Worker development put the same three in
`worker/.dev.vars` as plain `KEY=value` lines (gitignored).

Non-secret Worker config (`ALLOWED_ORIGINS`, `CONTACT_FROM`) lives in
`worker/wrangler.toml`.

## Deployment

### Site

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages.

Two things in `vite.config.ts` exist for Pages specifically:

- **`base: '/'`** — the site is served from the root of a custom domain. It
  must be absolute, not `'./'`: relative asset URLs resolve against `/contact/`
  and 404. If the site ever falls back to project pages, this becomes
  `'/<repo>/'` and the router's basename follows automatically.
- **`index.html` is copied to `404.html`** at build. GitHub Pages has no SPA
  rewrite, so a hard load of `/contact` serves `404.html`; shipping the app
  under that name makes the miss boot and route on the real URL.

### Worker

Deployed separately and manually:

```bash
npm run worker:deploy
```

CI does not deploy the Worker.

## DNS

The domain uses Google Workspace for email (`MX → smtp.google.com`), which
constrains what can be added:

- **Resend** verification records go on the `send.` subdomain plus the
  `resend._domainkey` selector, so the root MX and root SPF are untouched and
  Workspace is unaffected. The domain must show **Verified** in the Resend
  dashboard — adding the DNS records is not enough, the verify check has to be
  triggered there.
- **Cloudflare Email Routing is not an option.** It requires Cloudflare's own
  MX records on the root and cannot coexist with an external mail server; it
  would break inbound Workspace mail. Cloudflare Email Sending would work, but
  is Beta and requires the Workers Paid plan.
- If GitHub Pages ever serves `www` directly rather than redirecting to the
  apex, add `https://www.thehugecompany.net` to `ALLOWED_ORIGINS` or the form
  will 403 on submit.

## Debugging the contact form

`[observability]` is enabled on the Worker, so failures are logged. To watch
them live:

```bash
npx wrangler tail -c worker/wrangler.toml
```

Status codes map to specific gates:

| Status | Meaning |
|---|---|
| `403 forbidden_origin` | Origin not in `ALLOWED_ORIGINS` |
| `403 failed_challenge` | Turnstile rejected the token, or it was reused |
| `422 invalid_fields` | Missing name/message, or malformed email |
| `429 rate_limited` | More than 5 requests in a minute from one IP |
| `502 send_failed` | Resend rejected the send — the reason is in the Worker log |
