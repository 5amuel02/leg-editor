import Modal from '../ui/Modal'
import { SHORTCUT_GROUPS } from '../../lib/shortcuts'

/** Satu tombol keyboard, digambar seperti tuts fisik. */
function Key({ children }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-ink-200 bg-ink-50 px-1.5 font-sans text-[11px] font-semibold text-ink-700 shadow-[0_1px_0_var(--color-ink-200)]">
      {children}
    </kbd>
  )
}

/** Satu kombinasi tombol, mis. Ctrl + Shift + Z. */
function Combo({ keys }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <span key={k} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-[10px] text-ink-300">+</span>}
          <Key>{k}</Key>
        </span>
      ))}
    </span>
  )
}

/**
 * Panel daftar pintasan keyboard.
 *
 * Isinya dibaca dari `SHORTCUT_GROUPS` supaya tidak pernah berbeda dari
 * pintasan yang benar-benar ditangani editor. Penutupan lewat tombol X, klik
 * di luar panel, dan Escape sudah ditangani `Modal`.
 */
export default function ShortcutsModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pintasan keyboard"
      description="Semua pintasan yang tersedia di editor ini."
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.id}>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              {group.label}
            </h3>

            <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200">
              {group.items.map((item) => (
                <li
                  key={item.action}
                  className="flex items-start justify-between gap-4 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink-800">{item.action}</p>
                    {item.note && (
                      <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{item.note}</p>
                    )}
                  </div>

                  {/* Kombinasi alternatif ditaruh di baris yang sama, dipisah
                      "atau", supaya kolom kanan tetap bisa dipindai sekilas. */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Combo keys={item.keys} />
                    {item.alt && (
                      <>
                        <span className="text-[11px] text-ink-400">atau</span>
                        <Combo keys={item.alt} />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-[11px] leading-relaxed text-ink-400">
          Di macOS, <span className="font-semibold text-ink-500">Cmd</span> bekerja sama seperti{' '}
          <span className="font-semibold text-ink-500">Ctrl</span> pada semua pintasan di atas.
        </p>
      </div>
    </Modal>
  )
}
