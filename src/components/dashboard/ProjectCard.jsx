import { useEffect, useRef, useState } from 'react'
import { Copy, FileImage, MoreVertical, Pencil, Trash2 } from 'lucide-react'

/** Format tanggal relatif sederhana dalam bahasa Indonesia. */
function relativeTime(ts) {
  if (!ts) return '-'
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} menit lalu`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} jam lalu`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Kartu satu project di dashboard, lengkap dengan menu aksi. */
export default function ProjectCard({ project, onOpen, onRename, onDuplicate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const { width, height } = project.size

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onOpen(project.id)}
        className="block w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="leg-workspace flex aspect-[4/3] items-center justify-center overflow-hidden p-3">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="max-h-full max-w-full rounded-sm object-contain shadow-md"
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-sm bg-white shadow-md"
              style={{
                aspectRatio: `${width} / ${height}`,
                width: width >= height ? '80%' : 'auto',
                height: width >= height ? 'auto' : '80%',
              }}
            >
              <FileImage size={22} className="text-ink-300" />
            </div>
          )}
        </div>

        <div className="border-t border-ink-100 px-3 py-2.5 text-left">
          <p className="truncate text-sm font-semibold text-ink-800">{project.name}</p>
          <p className="mt-0.5 text-[11px] text-ink-400">
            {width} × {height} px · {project.pages?.length || 1} halaman · {relativeTime(project.updatedAt)}
          </p>
        </div>
      </button>

      {/* Menu aksi (muncul saat hover / saat terbuka) */}
      <div
        ref={menuRef}
        className={`absolute right-2 top-2 transition ${
          menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <button
          type="button"
          aria-label="Menu project"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((o) => !o)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-ink-600 shadow-md ring-1 ring-ink-200 hover:bg-white"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div className="leg-pop absolute right-0 mt-1 w-44 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-xl">
            {[
              { icon: Pencil, label: 'Ganti nama', action: () => onRename(project) },
              { icon: Copy, label: 'Duplikat', action: () => onDuplicate(project) },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  action()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
              >
                <Icon size={15} /> {label}
              </button>
            ))}
            <div className="my-1 h-px bg-ink-100" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onDelete(project)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} /> Hapus
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
