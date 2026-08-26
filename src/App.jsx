import { useCallback, useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import EditorPage from './pages/EditorPage'
import { ToastProvider } from './components/ui/Toast'
import { lsGet, lsSet } from './lib/db'

/**
 * Root aplikasi.
 *
 * Navigasi dibuat sederhana memakai state (tanpa router) karena aplikasi
 * hanya punya dua layar: Dashboard dan Editor. `activeProjectId` yang
 * sedang dibuka juga disimpan ke localStorage agar bisa dilanjutkan nanti.
 */
export default function App() {
  const [view, setView] = useState('dashboard')
  const [activeProjectId, setActiveProjectId] = useState(null)

  // Memulihkan id project terakhir (dipakai tombol "Lanjutkan" di dashboard).
  useEffect(() => {
    const last = lsGet('lastProjectId', null)
    if (last) setActiveProjectId(last)
  }, [])

  const openEditor = useCallback((projectId) => {
    setActiveProjectId(projectId)
    lsSet('lastProjectId', projectId)
    setView('editor')
  }, [])

  const goDashboard = useCallback(() => {
    setView('dashboard')
  }, [])

  return (
    <ToastProvider>
      {view === 'dashboard' ? (
        <Dashboard onOpenProject={openEditor} lastProjectId={activeProjectId} />
      ) : (
        <EditorPage projectId={activeProjectId} onBack={goDashboard} />
      )}
    </ToastProvider>
  )
}
