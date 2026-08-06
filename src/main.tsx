import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

// Home starts locked at the top on every load. Letting the browser restore a
// previous scroll position would strand the viewer mid-page with the scroll
// frozen and no way back.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BASE_URL tracks vite's `base`, so routes resolve correctly whether the
        site is served from /website/ on GitHub Pages or / on a custom domain. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
