/**
 * Single source of truth for per-route SEO metadata.
 *
 * Three consumers read this and must never disagree:
 *   - scripts/prerender.mjs  bakes it into the static HTML head at build time
 *   - scripts/prerender.mjs  generates sitemap.xml from the same list
 *   - useDocumentMeta()      updates the live document on client-side navigation
 *
 * Adding a route here is therefore the only step needed to get it prerendered,
 * described, and listed in the sitemap.
 */

export const SITE_URL = 'https://thehugecompany.net'
export const SITE_NAME = 'The Huge Company'

/** Absolute URL of the social preview card. Must be absolute — relative paths
 *  are ignored by every scraper. */
export const OG_IMAGE = `${SITE_URL}/og.png`

export type RouteMeta = {
  /** Route path as react-router sees it, always leading-slash, never trailing. */
  path: string
  title: string
  description: string
  /** Relative priority for sitemap.xml. */
  priority: number
}

export const ROUTES: RouteMeta[] = [
  {
    path: '/',
    title: 'The Huge Company — Custom Software for Real Estate',
    description:
      'Off-the-shelf software makes you work its way. We build the opposite: tools shaped around how your brokerage actually runs — one workflow or the whole platform.',
    priority: 1.0,
  },
  {
    path: '/solutions',
    title: 'What We Build — Real Estate Software | The Huge Company',
    description:
      'Commission logic, leasing funnels, transaction pipelines and market data — the places real estate software keeps leaving agents stranded, and what we build instead.',
    priority: 0.9,
  },
  {
    path: '/about-us',
    title: 'About Us — The Huge Company',
    description:
      'Agents do not have generic problems, so we do not ship generic solutions. Meet the founders building custom software around the specific shape of your workflow.',
    priority: 0.7,
  },
  {
    path: '/contact',
    title: 'Contact — The Huge Company',
    description:
      'Tell us which part of your week is costing you the most. We reply to every enquiry personally.',
    priority: 0.6,
  },
]

/**
 * Metadata for the catch-all route. Deliberately not in ROUTES: it must never
 * be prerendered as its own URL or listed in the sitemap. It is rendered into
 * 404.html instead, where the head is replaced with a noindex block.
 */
export const NOT_FOUND_META: RouteMeta = {
  path: '*',
  title: `Page not found — ${SITE_NAME}`,
  description: 'That page has either moved or never existed.',
  priority: 0,
}

/** Any path that cannot match a real route, used to drive the catch-all when
 *  prerendering 404.html. */
export const NOT_FOUND_PROBE = '/__not-found__'

export const routeMetaFor = (pathname: string): RouteMeta => {
  // Matched the way react-router matches, or the two disagree: it resolves
  // /Solutions and /solutions/ to the same route, so looking either up here
  // must not fall through to "page not found" while the real page renders.
  const normalised =
    pathname !== '/' ? pathname.replace(/\/+$/, '').toLowerCase() : '/'
  return ROUTES.find((r) => r.path === normalised) ?? NOT_FOUND_META
}

/** Structured data for the homepage. Organization drives knowledge-panel
 *  eligibility; WebSite declares the canonical site name for search results. */
export const jsonLd = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      'Custom software built for real estate brokerages, agents and property teams.',
    founder: [
      { '@type': 'Person', name: 'Uthkarsh Pai' },
      { '@type': 'Person', name: 'Vallabh Gopu' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'contact@thehugecompany.net',
      url: `${SITE_URL}/contact`,
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  },
]
