/**
 * Turns the built SPA into one real HTML file per route.
 *
 * Why this exists: GitHub Pages has no rewrite rules, so a hard load of
 * /solutions used to fall through to 404.html — which boots the app correctly
 * for a human but is served with an HTTP 404, and Google will not index a URL
 * that 404s. Emitting an actual file at that path makes Pages return 200, and
 * fills it with the rendered markup so crawlers that do not run JavaScript see
 * the content too.
 *
 * Runs after both `vite build` (client) and `vite build --ssr` (server bundle).
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
const ssrDir = resolve(root, 'dist-ssr')

const { render, ROUTES, SITE_URL, SITE_NAME, OG_IMAGE, jsonLd } = await import(
  pathToFileURL(resolve(ssrDir, 'entry-server.js')).href
)

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const canonicalFor = (path) => `${SITE_URL}${path === '/' ? '/' : path}`

const headFor = (meta) => {
  const canonical = canonicalFor(meta.path)
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
  ]

  if (meta.path === '/') {
    // `<` is escaped so a stray "</script>" inside the data can never close the
    // tag early. JSON parsers read the escape fine.
    const data = JSON.stringify(jsonLd()).replace(/</g, '\\u003c')
    tags.push(`<script type="application/ld+json">${data}</script>`)
  }

  return tags.join('\n    ')
}

const SEO_BLOCK = /<!--seo:start-->[\s\S]*?<!--seo:end-->/
const ROOT_DIV = '<div id="root"></div>'

const template = await readFile(resolve(dist, 'index.html'), 'utf8')

if (!SEO_BLOCK.test(template) || !template.includes(ROOT_DIV)) {
  throw new Error(
    'dist/index.html is missing the seo markers or the empty root div — ' +
      'index.html changed shape and prerendering would silently do nothing.',
  )
}

const write = async (file, contents) => {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, contents, 'utf8')
}

for (const meta of ROUTES) {
  const appHtml = render(meta.path)
  const html = template
    .replace(SEO_BLOCK, headFor(meta))
    .replace(ROOT_DIV, `<div id="root">${appHtml}</div>`)

  if (meta.path === '/') {
    await write(resolve(dist, 'index.html'), html)
  } else {
    const name = meta.path.slice(1)
    // Both spellings, because Pages resolves /solutions and /solutions/ from
    // different files. Serving each directly avoids a redirect hop, and the
    // canonical tag in both points at the no-slash form.
    await write(resolve(dist, `${name}.html`), html)
    await write(resolve(dist, name, 'index.html'), html)
  }
  console.log(`prerendered ${meta.path}`)
}

/**
 * The SPA fallback still catches genuinely unknown URLs. It must not claim to
 * be the homepage: without this it would inherit the homepage's canonical tag
 * and invite Google to index every typo'd URL as a duplicate of /.
 */
await write(
  resolve(dist, '404.html'),
  template.replace(
    SEO_BLOCK,
    [
      '<title>Page not found — The Huge Company</title>',
      '<meta name="robots" content="noindex" />',
    ].join('\n    '),
  ),
)
console.log('wrote 404.html (noindex)')

/**
 * No <lastmod>: it would have to be the build date, which claims every page
 * changed on every deploy. Google discounts lastmod it finds untrustworthy, so
 * omitting it is strictly better than filling it in with a lie.
 */
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...ROUTES.map(
    (r) =>
      `  <url><loc>${canonicalFor(r.path)}</loc><priority>${r.priority.toFixed(1)}</priority></url>`,
  ),
  '</urlset>',
  '',
].join('\n')

await write(resolve(dist, 'sitemap.xml'), sitemap)
console.log(`wrote sitemap.xml (${ROUTES.length} urls)`)

await rm(ssrDir, { recursive: true, force: true })
