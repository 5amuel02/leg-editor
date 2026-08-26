import { useMemo } from 'react'
import {
  AlignEndHorizontal,
  AlignHorizontalJustifyCenter,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignVerticalJustifyCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Crop,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Minus,
  Paintbrush,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useEditor } from '../../context/EditorContext'
import { getLegType } from '../../lib/fabricUtils'
import { STROKE_STYLES } from '../../lib/constants'
import IconButton from '../ui/IconButton'
import ColorPicker from '../ui/ColorPicker'
import Popover from './Popover'
import { SliderInput } from '../ui/Field'

/**
 * Toolbar kontekstual yang mengambang tepat di atas elemen terpilih.
 * Tombol yang muncul menyesuaikan jenis elemen (gambar punya Crop,
 * teks punya Edit langsung, garis/panah hanya punya pengaturan stroke, dll).
 */
export default function FloatingToolbar({ onRequestCrop }) {
  const {
    selection,
    propsVersion,
    zoom,
    canvasRef,
    updateSelected,
    deleteSelected,
    duplicateObject,
    flipSelected,
    alignSelected,
    orderSelected,
    copyStyleFromSelection,
    formatPainterOn,
    cancelFormatPainter,
  } = useEditor()

  const target = selection.length === 1 ? selection[0] : null
  const multi = selection.length > 1

  /* Posisi toolbar dihitung dari bounding box objek (koordinat scene × zoom). */
  const position = useMemo(() => {
    const canvas = canvasRef.current
    if (!canvas || selection.length === 0) return null
    const active = canvas.getActiveObject()
    if (!active) return null
    const b = active.getBoundingRect()
    return {
      left: (b.left + b.width / 2) * zoom,
      top: b.top * zoom,
      bottom: (b.top + b.height) * zoom,
    }
    // propsVersion memaksa hitung ulang saat objek digeser/diskalakan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, propsVersion, zoom])

  if (!position) return null

  const type = target ? getLegType(target) : 'multi'
  const isText = type === 'text'
  const isImage = type === 'image'
  // fabric.Line tidak merender `fill`, dan gambar diwarnai oleh isinya sendiri —
  // selain dua itu, semua elemen punya warna isi & warna garis yang terpisah.
  const canFill = !isImage && type !== 'line'

  // Bila elemen menempel di tepi atas, toolbar dipindah ke bawah elemen.
  const placeBelow = position.top < 56
  const style = {
    left: position.left,
    top: placeBelow ? position.bottom + 12 : position.top - 12,
    transform: placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
  }

  const dashValue =
    STROKE_STYLES.find(
      (s) =>
        JSON.stringify(s.dash) === JSON.stringify(target?.strokeDashArray || null),
    )?.id || 'solid'

  /** Tombol Edit: teks langsung masuk mode ketik, lainnya buka panel properti. */
  const handleEdit = () => {
    if (isText && target?.enterEditing) {
      target.enterEditing()
      target.selectAll?.()
      canvasRef.current?.requestRenderAll()
    } else {
      window.dispatchEvent(new CustomEvent('leg:open-properties'))
    }
  }

  const alignButtons = [
    { mode: 'left', icon: AlignLeft, label: 'Rata kiri' },
    { mode: 'center', icon: AlignHorizontalJustifyCenter, label: 'Rata tengah (horizontal)' },
    { mode: 'right', icon: AlignRight, label: 'Rata kanan' },
    { mode: 'top', icon: AlignStartHorizontal, label: 'Rata atas' },
    { mode: 'middle', icon: AlignVerticalJustifyCenter, label: 'Rata tengah (vertikal)' },
    { mode: 'bottom', icon: AlignEndHorizontal, label: 'Rata bawah' },
  ]

  return (
    <div
      className="leg-pop absolute z-40 flex items-center gap-0.5 rounded-xl border border-ink-200 bg-white/98 px-1.5 py-1 shadow-xl backdrop-blur"
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {!multi && (
        <IconButton label={isText ? 'Edit teks' : 'Edit elemen'} size="sm" onClick={handleEdit}>
          <Pencil size={15} />
        </IconButton>
      )}

      {isImage && (
        <IconButton label="Crop / potong gambar" size="sm" onClick={() => onRequestCrop?.(target)}>
          <Crop size={15} />
        </IconButton>
      )}

      {/* Flip */}
      <IconButton label="Balik horizontal" size="sm" onClick={() => flipSelected('x')}>
        <FlipHorizontal size={15} />
      </IconButton>
      <IconButton label="Balik vertikal" size="sm" onClick={() => flipSelected('y')}>
        <FlipVertical size={15} />
      </IconButton>

      <span className="mx-1 h-5 w-px bg-ink-200" />

      {/* Warna isi — kotak terisi penuh */}
      {canFill && (
        <ColorPicker
          size="sm"
          label="Warna isi (fill)"
          allowNone
          value={typeof target?.fill === 'string' ? target.fill : '#8b5cf6'}
          onChange={(c) => updateSelected({ fill: c })}
        />
      )}

      {/* Warna garis — cincin, selalu tampil berdampingan dengan warna isi
          supaya jelas keduanya diatur terpisah. */}
      <ColorPicker
        size="sm"
        variant="ring"
        label="Warna garis / outline (stroke)"
        allowNone
        value={typeof target?.stroke === 'string' ? target.stroke : null}
        onChange={(c) =>
          updateSelected({
            stroke: c,
            strokeWidth: c && !target?.strokeWidth ? 2 : target?.strokeWidth,
          })
        }
      />

      {/* Ketebalan & jenis garis */}
      <Popover
        width="w-60"
        trigger={(toggle, open) => (
          <IconButton label="Ketebalan & jenis garis" size="sm" active={open} onClick={toggle}>
            <Minus size={15} strokeWidth={3} />
          </IconButton>
        )}
      >
        {() => (
          <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-ink-500">Ketebalan</p>
                <SliderInput
                  min={0}
                  max={40}
                  step={1}
                  value={target?.strokeWidth || 0}
                  onChange={(v) =>
                    updateSelected({
                      strokeWidth: v,
                      stroke: target?.stroke || '#1e293b',
                    })
                  }
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-ink-500">Jenis garis</p>
                <div className="flex gap-1.5">
                  {STROKE_STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updateSelected({ strokeDashArray: s.dash })}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] transition ${
                        dashValue === s.id
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
          </div>
        )}
      </Popover>

      {/* Posisi: align cepat + urutan tumpukan */}
      <Popover
        width="w-60"
        trigger={(toggle, open) => (
          <IconButton label="Posisi & urutan" size="sm" active={open} onClick={toggle}>
            <Layers size={15} />
          </IconButton>
        )}
      >
        {() => (
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-500">Rata elemen</p>
              <div className="grid grid-cols-6 gap-1">
                {alignButtons.map(({ mode, icon: Icon, label }) => (
                  <IconButton key={mode} size="sm" label={label} onClick={() => alignSelected(mode)}>
                    <Icon size={14} />
                  </IconButton>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-500">Urutan tumpukan</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => orderSelected('front')}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-2 py-1.5 text-[11px] text-ink-700 hover:bg-ink-50"
                >
                  <ArrowUpToLine size={13} /> Paling depan
                </button>
                <button
                  type="button"
                  onClick={() => orderSelected('back')}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-2 py-1.5 text-[11px] text-ink-700 hover:bg-ink-50"
                >
                  <ArrowDownToLine size={13} /> Paling belakang
                </button>
                <button
                  type="button"
                  onClick={() => orderSelected('forward')}
                  className="rounded-lg border border-ink-200 px-2 py-1.5 text-[11px] text-ink-700 hover:bg-ink-50"
                >
                  Maju 1
                </button>
                <button
                  type="button"
                  onClick={() => orderSelected('backward')}
                  className="rounded-lg border border-ink-200 px-2 py-1.5 text-[11px] text-ink-700 hover:bg-ink-50"
                >
                  Mundur 1
                </button>
              </div>
            </div>
          </div>
        )}
      </Popover>

      {/* Format painter (salin style) */}
      <IconButton
        label={formatPainterOn ? 'Batalkan format painter' : 'Salin style (format painter)'}
        size="sm"
        active={formatPainterOn}
        onClick={() => (formatPainterOn ? cancelFormatPainter() : copyStyleFromSelection())}
      >
        <Paintbrush size={15} />
      </IconButton>

      <span className="mx-1 h-5 w-px bg-ink-200" />

      <IconButton label="Duplikat" size="sm" onClick={() => duplicateObject()}>
        <Copy size={15} />
      </IconButton>
      <IconButton label="Hapus" size="sm" danger onClick={deleteSelected}>
        <Trash2 size={15} />
      </IconButton>
    </div>
  )
}
