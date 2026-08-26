import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Konfigurasi Vite: React + Tailwind v4 (plugin resmi, tanpa file postcss/tailwind.config).
// server.host dibiarkan default (localhost) karena aplikasi ini murni dipakai lokal.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: true },
})
