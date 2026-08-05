import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * GitHub Pages has no SPA rewrite: a hard load of /contact looks for a file
 * that doesn't exist, so Pages serves 404.html. Shipping a copy of index.html
 * under that name makes the miss boot the app instead, which then routes on
 * the real URL. This needs an absolute `base` — with the previous relative
 * './' the asset URLs would resolve against /contact/ and 404.
 */
const githubPagesSpaFallback = () => ({
  name: 'github-pages-spa-fallback',
  closeBundle() {
    const dist = resolve(import.meta.dirname, 'dist')
    copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
  },
})

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of a custom domain. If the site ever falls back to
  // project pages this becomes '/<repo>/' — BrowserRouter's basename reads
  // BASE_URL, so routing follows this automatically either way.
  base: '/',
  plugins: [react(), tailwindcss(), githubPagesSpaFallback()],
})
