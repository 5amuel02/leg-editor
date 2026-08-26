import { useState } from 'react'
import { ChevronLeft, Image, Layers, PencilRuler, Shapes, Type } from 'lucide-react'
import ElementsPanel from './panels/ElementsPanel'
import TextPanel from './panels/TextPanel'
import UploadsPanel from './panels/UploadsPanel'
import ToolsPanel from './panels/ToolsPanel'
import LayersPanel from './panels/LayersPanel'

/** Definisi tab sidebar kiri; isi panel berubah sesuai tab aktif. */
const TABS = [
  { id: 'elements', label: 'Elemen', icon: Shapes, Panel: ElementsPanel },
  { id: 'text', label: 'Teks', icon: Type, Panel: TextPanel },
  { id: 'uploads', label: 'Unggahan', icon: Image, Panel: UploadsPanel },
  { id: 'tools', label: 'Alat', icon: PencilRuler, Panel: ToolsPanel },
  { id: 'layers', label: 'Layer', icon: Layers, Panel: LayersPanel },
]

export default function LeftSidebar() {
  const [active, setActive] = useState('elements')
  const [collapsed, setCollapsed] = useState(false)

  const current = TABS.find((t) => t.id === active)
  const Panel = current.Panel

  return (
    <div className="z-20 flex shrink-0 border-r border-ink-200 bg-white">
      {/* Rail ikon */}
      <nav className="flex w-[72px] shrink-0 flex-col gap-1 border-r border-ink-100 bg-ink-50/60 py-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === active && !collapsed
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === active) setCollapsed((c) => !c)
                else {
                  setActive(tab.id)
                  setCollapsed(false)
                }
              }}
              className={`mx-1.5 flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-500 hover:bg-ink-200/60 hover:text-ink-700'
              }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Isi panel */}
      {!collapsed && (
        <div className="relative flex w-[288px] shrink-0 flex-col">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-ink-100 px-4">
            <h2 className="text-sm font-bold text-ink-800">{current.label}</h2>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Sembunyikan panel"
              className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <Panel />
          </div>
        </div>
      )}
    </div>
  )
}
