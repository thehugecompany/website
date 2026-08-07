import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of a custom domain. If the site ever falls back to
  // project pages this becomes '/<repo>/' — BrowserRouter's basename reads
  // BASE_URL, so routing follows this automatically either way.
  base: '/',
  plugins: [react(), tailwindcss()],
})
