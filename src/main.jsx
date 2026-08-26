import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * Service worker hanya didaftarkan pada build produksi. Di mode dev ia akan
 * menyajikan modul dari cache dan membuat hot reload Vite tampak "macet"
 * pada versi lama — gejala yang sangat membingungkan saat sedang mengoding.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Pemasangan gagal (mis. dibuka lewat file://) — aplikasi tetap jalan. */
    })
  })
}
