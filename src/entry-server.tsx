import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'

/**
 * Build-time entry point. Never shipped to the browser — scripts/prerender.mjs
 * imports this in Node to turn each route into static HTML.
 *
 * StrictMode is deliberately absent: it double-renders to surface side effects,
 * which is useful in development and pure cost here.
 */
export function render(path: string): string {
  return renderToString(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>,
  )
}

// Re-exported so the prerender script reads route metadata from the compiled
// bundle rather than parsing TypeScript itself.
export {
  ROUTES,
  SITE_URL,
  SITE_NAME,
  OG_IMAGE,
  jsonLd,
  NOT_FOUND_META,
  NOT_FOUND_PROBE,
} from './seo'
