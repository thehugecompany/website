import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { SITE_URL, routeMetaFor } from './seo'

const setMeta = (selector: string, attr: string, value: string) => {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

/**
 * Keeps the document head in sync with the current route.
 *
 * The prerendered HTML already carries the correct tags for the URL a visitor
 * lands on, which is what crawlers read. This exists for what happens after:
 * client-side navigation swaps the view without touching the head, so without
 * it every subsequent page would keep the landing page's title — visible in the
 * tab, in bookmarks, and in browser history.
 */
export function useDocumentMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = routeMetaFor(pathname)
    const canonical = `${SITE_URL}${meta.path === '/' ? '/' : meta.path}`

    document.title = meta.title
    setMeta('meta[name="description"]', 'content', meta.description)
    setMeta('link[rel="canonical"]', 'href', canonical)
    setMeta('meta[property="og:title"]', 'content', meta.title)
    setMeta('meta[property="og:description"]', 'content', meta.description)
    setMeta('meta[property="og:url"]', 'content', canonical)
    setMeta('meta[name="twitter:title"]', 'content', meta.title)
    setMeta('meta[name="twitter:description"]', 'content', meta.description)
  }, [pathname])
}
