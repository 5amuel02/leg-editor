import { useEffect, useState } from 'react'
import {
  AlignCenter,
  AlignEndHorizontal,
  AlignHorizontalJustifyCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignVerticalJustifyCenter,
  Bold,
  Copy,
  Crop,
  Italic,
  Lock,
  Strikethrough,
  Trash2,
  Underline,
  Unlock,
} from 'lucide-react'
import { useEditor } from '../../context/EditorContext'
import { getLegType, readTableStyle } from '../../lib/fabricUtils'
import { FONT_FAMILIES, STROKE_STYLES } from '../../lib/constants'
import { MASK_SHAPES, createClipShape } from '../../lib/frames'
import {
  DEFAULT_EFFECT_COLOR,
  DEFAULT_EFFECT_STRENGTH,
  TEXT_EFFECTS,
  applyTextEffect,
} from '../../lib/textEffects'
import ColorPicker from '../ui/ColorPicker'
import IconButton from '../ui/IconButton'
import Button from '../ui/Button'
import { FieldRow, NumberInput, SectionTitle, Select, SliderInput } from '../ui/Field'

const ALIGN_H = [
  { mode: 'left', icon: AlignLeft, label: 'Rata kiri kanvas' },
  { mode: 'center', icon: AlignHorizontalJustifyCenter, label: 'Rata tengah horizontal' },
  { mode: 'right', icon: AlignRight, label: 'Rata kanan kanvas' },
]
const ALIGN_V = [
  { mode: 'top', icon: AlignStartHorizontal, label: 'Rata atas kanvas' },
  { mode: 'middle', icon: AlignVerticalJustifyCenter, label: 'Rata tengah vertikal' },
  { mode: 'bottom', icon: AlignEndHorizontal, label: 'Rata bawah kanvas' },
]
const TEXT_ALIGN = [
  { value: 'left', icon: AlignLeft },
  { value: 'center', icon: AlignCenter },
  { value: 'right', icon: AlignRight },
  { value: 'justify', icon: AlignJustify },
]

/**
 * Panel properti kontekstual di sisi kanan.
 * - Tanpa seleksi  -> properti halaman (warna latar, ukuran, kunci/sembunyi)
 * - Ada seleksi    -> properti sesuai jenis elemen + posisi/ukuran/rotasi
 */
export default function PropertiesPanel({ onRequestCrop }) {
  const {
    selection,
    propsVersion,
    updateSelected,
    alignSelected,
    deleteSelected,
    duplicateObject,
    toggleObjectLock,
    activePage,
    activeIndex,
    updatePage,
    setPageBackground,
    size,
    pages,
    canvasRef,
  } = useEditor()

  /** Menerapkan preset efek teks lalu mencatatnya ke riwayat undo. */
  const applyEffect = (effectId, options) => {
    const active = canvasRef.current?.getActiveObject()
    if (!active) return
    applyTextEffect(active, effectId, options)
    updateSelected({}, { record: true })
  }

  const [open, setOpen] = useState(true)

  // Tombol "Edit" pada toolbar mengambang membuka panel ini.
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('leg:open-properties', handler)
    return () => window.removeEventListener('leg:open-properties', handler)
  }, [])

  const target = selection.length === 1 ? selection[0] : null
  const multi = selection.length > 1
  const type = target ? getLegType(target) : null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="z-20 flex w-8 shrink-0 items-center justify-center border-l border-ink-200 bg-white text-[10px] font-semibold uppercase tracking-widest text-ink-400 [writing-mode:vertical-rl] hover:bg-ink-50"
      >
        Properti
      </button>
    )
  }

  return (
    <aside className="z-20 flex w-72 shrink-0 flex-col border-l border-ink-200 bg-white">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-ink-100 px-4">
        <h2 className="text-sm font-bold text-ink-800">
          {multi ? `${selection.length} elemen terpilih` : target ? 'Properti elemen' : 'Properti halaman'}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] text-ink-400 hover:text-ink-600"
        >
          Tutup
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* ---------------- Tanpa seleksi: properti halaman ---------------- */}
        {!target && !multi && (
          <PageProperties
            page={activePage}
            index={activeIndex}
            total={pages.length}
            size={size}
            updatePage={updatePage}
            setPageBackground={setPageBackground}
          />
        )}

        {/* ---------------- Perataan (selalu tampil saat ada seleksi) ---------------- */}
        {(target || multi) && (
          <div>
            <SectionTitle>Rata elemen</SectionTitle>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-ink-100 p-0.5">
                {ALIGN_H.map(({ mode, icon: Icon, label }) => (
                  <IconButton key={mode} size="sm" label={label} onClick={() => alignSelected(mode)}>
                    <Icon size={15} />
                  </IconButton>
                ))}
              </div>
              <div className="flex rounded-lg bg-ink-100 p-0.5">
                {ALIGN_V.map(({ mode, icon: Icon, label }) => (
                  <IconButton key={mode} size="sm" label={label} onClick={() => alignSelected(mode)}>
                    <Icon size={15} />
                  </IconButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Properti khusus jenis elemen ---------------- */}
        {target && type === 'text' && (
          <TextProperties target={target} update={updateSelected} applyEffect={applyEffect} />
        )}

        {target && (type === 'shape' || type === 'bubble' || type === 'frame') && (
          <FillStrokeProperties target={target} update={updateSelected} withFill />
        )}

        {target && type === 'frame' && (
          <p className="rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
            Bingkai masih kosong. Pilih gambar di tab Unggahan — atau seret gambar ke atas
            bingkai ini — untuk mengisinya.
          </p>
        )}

        {target && type === 'table' && <TableProperties target={target} update={updateSelected} />}

        {target && (type === 'line' || type === 'arrow' || type === 'draw') && (
          // fabric.Line tidak merender `fill`, jadi khusus garis lurus kontrol
          // warna isi disembunyikan; panah & coretan tetap bisa diisi warna.
          <FillStrokeProperties target={target} update={updateSelected} withFill={type !== 'line'} />
        )}

        {target && type === 'image' && (
          <ImageProperties target={target} update={updateSelected} onRequestCrop={onRequestCrop} />
        )}

        {/* ---------------- Transform ---------------- */}
        {target && <TransformProperties key={propsVersion} target={target} update={updateSelected} canvas={canvasRef.current} />}

        {/* ---------------- Aksi cepat ---------------- */}
        {(target || multi) && (
          <div>
            <SectionTitle>Aksi</SectionTitle>
            <div className="grid grid-cols-3 gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => duplicateObject()}>
                <Copy size={14} /> Salin
              </Button>
              <Button size="sm" variant="secondary" onClick={() => toggleObjectLock()}>
                {target?.legLocked ? <Unlock size={14} /> : <Lock size={14} />} Kunci
              </Button>
              <Button size="sm" variant="dangerGhost" onClick={deleteSelected}>
                <Trash2 size={14} /> Hapus
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-panel                                                           */
/* ------------------------------------------------------------------ */

function PageProperties({ page, index, total, size, updatePage, setPageBackground }) {
  return (
    <>
      <div>
        <SectionTitle>Halaman</SectionTitle>
        <input
          value={page?.name || ''}
          onChange={(e) => updatePage(index, { name: e.target.value })}
          className="h-9 w-full rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-400"
        />
        <p className="mt-1.5 text-[11px] text-ink-400">
          Halaman {index + 1} dari {total} · {size.width} × {size.height} px
        </p>
      </div>

      <div>
        <SectionTitle>Warna latar halaman</SectionTitle>
        <div className="flex items-center gap-2">
          <ColorPicker
            value={page?.background || '#ffffff'}
            onChange={setPageBackground}
            label="Warna latar"
          />
          <div className="flex gap-1.5">
            {['#ffffff', '#0f172a', '#f8fafc', '#fef3c7', '#dbeafe', '#dcfce7'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPageBackground(c)}
                title={c}
                className="h-6 w-6 rounded-md border border-ink-200 transition hover:scale-110"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
        Pilih sebuah elemen di kanvas untuk melihat pengaturannya di sini. Semua halaman dalam
        project memakai ukuran yang sama.
      </p>
    </>
  )
}

function TextProperties({ target, update, applyEffect }) {
  const isBold = target.fontWeight === 'bold' || Number(target.fontWeight) >= 600
  return (
    <div className="space-y-3">
      <SectionTitle>Teks</SectionTitle>

      <Select
        fontPreview
        className="w-full"
        value={target.fontFamily || FONT_FAMILIES[0]}
        onChange={(v) => update({ fontFamily: v })}
        options={FONT_FAMILIES.map((f) => ({ value: f, label: f.split(',')[0] }))}
      />

      <FieldRow label="Ukuran">
        <NumberInput
          className="w-20"
          value={Math.round(target.fontSize || 0)}
          min={4}
          max={800}
          onChange={(v) => update({ fontSize: v })}
        />
        <ColorPicker
          size="sm"
          align="right"
          label="Warna teks"
          value={typeof target.fill === 'string' ? target.fill : '#000000'}
          onChange={(c) => update({ fill: c })}
        />
      </FieldRow>

      <div className="flex flex-wrap items-center gap-1">
        <IconButton
          size="sm"
          label="Tebal"
          active={isBold}
          onClick={() => update({ fontWeight: isBold ? 'normal' : 'bold' })}
        >
          <Bold size={15} />
        </IconButton>
        <IconButton
          size="sm"
          label="Miring"
          active={target.fontStyle === 'italic'}
          onClick={() => update({ fontStyle: target.fontStyle === 'italic' ? 'normal' : 'italic' })}
        >
          <Italic size={15} />
        </IconButton>
        <IconButton
          size="sm"
          label="Garis bawah"
          active={!!target.underline}
          onClick={() => update({ underline: !target.underline })}
        >
          <Underline size={15} />
        </IconButton>
        <IconButton
          size="sm"
          label="Coret"
          active={!!target.linethrough}
          onClick={() => update({ linethrough: !target.linethrough })}
        >
          <Strikethrough size={15} />
        </IconButton>

        <span className="mx-1 h-5 w-px bg-ink-200" />

        {TEXT_ALIGN.map(({ value, icon: Icon }) => (
          <IconButton
            key={value}
            size="sm"
            label={`Perataan ${value}`}
            active={target.textAlign === value}
            onClick={() => update({ textAlign: value })}
          >
            <Icon size={15} />
          </IconButton>
        ))}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Jarak baris</p>
        <SliderInput
          min={0.6}
          max={3}
          step={0.05}
          value={target.lineHeight ?? 1.16}
          onChange={(v) => update({ lineHeight: v })}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Jarak huruf</p>
        <SliderInput
          min={-200}
          max={800}
          step={10}
          value={target.charSpacing ?? 0}
          onChange={(v) => update({ charSpacing: v })}
        />
      </div>

      <TextEffectsSection target={target} applyEffect={applyEffect} />
    </div>
  )
}

/**
 * Galeri efek teks. Setiap kartu memakai gaya CSS pendekatan agar
 * pratinjaunya mirip hasil di kanvas tanpa perlu merender ulang Fabric.
 */
function TextEffectsSection({ target, applyEffect }) {
  const active = target.legTextEffect || 'none'
  const accent = target.legEffectColor || DEFAULT_EFFECT_COLOR
  const strength = target.legEffectStrength ?? DEFAULT_EFFECT_STRENGTH

  return (
    <div className="space-y-3 border-t border-ink-100 pt-4">
      <SectionTitle>Efek teks</SectionTitle>

      <div className="grid grid-cols-3 gap-1.5">
        {TEXT_EFFECTS.map((effect) => (
          <button
            key={effect.id}
            type="button"
            title={effect.label}
            onClick={() => applyEffect(effect.id, { color: accent, strength })}
            className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition ${
              active === effect.id
                ? 'border-brand-500 bg-brand-50'
                : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50'
            }`}
          >
            <span className="flex h-7 items-center justify-center">
              <span
                className="text-base font-bold leading-none text-ink-800"
                style={effect.preview(accent)}
              >
                Ag
              </span>
            </span>
            <span className="w-full truncate text-center text-[9px] leading-tight text-ink-500">
              {effect.label}
            </span>
          </button>
        ))}
      </div>

      {active !== 'none' && (
        <>
          <FieldRow label="Warna efek">
            <ColorPicker
              size="sm"
              align="right"
              label="Warna efek"
              value={accent}
              onChange={(c) => applyEffect(active, { color: c, strength })}
            />
          </FieldRow>

          <div>
            <p className="mb-1 text-xs font-medium text-ink-500">Intensitas</p>
            <SliderInput
              min={0}
              max={100}
              step={5}
              value={strength}
              onChange={(v) => applyEffect(active, { color: accent, strength: v })}
            />
          </div>
        </>
      )}
    </div>
  )
}

function FillStrokeProperties({ target, update, withFill }) {
  const dashId =
    STROKE_STYLES.find(
      (s) => JSON.stringify(s.dash) === JSON.stringify(target.strokeDashArray || null),
    )?.id || 'solid'

  return (
    <div className="space-y-3">
      <SectionTitle>Warna & garis</SectionTitle>

      {withFill && (
        <FieldRow label="Warna isi">
          <ColorPicker
            size="sm"
            align="right"
            label="Warna isi"
            allowNone
            value={typeof target.fill === 'string' ? target.fill : null}
            onChange={(c) => update({ fill: c })}
          />
        </FieldRow>
      )}

      <FieldRow label="Warna garis">
        <ColorPicker
          size="sm"
          variant="ring"
          align="right"
          label="Warna garis"
          allowNone
          value={typeof target.stroke === 'string' ? target.stroke : null}
          onChange={(c) => update({ stroke: c, strokeWidth: c && !target.strokeWidth ? 2 : target.strokeWidth })}
        />
      </FieldRow>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Ketebalan garis</p>
        <SliderInput
          min={0}
          max={60}
          step={1}
          value={target.strokeWidth || 0}
          onChange={(v) => update({ strokeWidth: v, stroke: target.stroke || '#1e293b' })}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Jenis garis</p>
        <div className="flex gap-1.5">
          {STROKE_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => update({ strokeDashArray: s.dash })}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] transition ${
                dashId === s.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {target.type === 'rect' && (
        <div>
          <p className="mb-1 text-xs font-medium text-ink-500">Sudut membulat</p>
          <SliderInput
            min={0}
            max={Math.round(Math.min(target.width, target.height) / 2)}
            step={1}
            value={target.rx || 0}
            onChange={(v) => update({ rx: v, ry: v })}
          />
        </div>
      )}
    </div>
  )
}

function TableProperties({ target, update }) {
  const style = readTableStyle(target)
  const dashId =
    STROKE_STYLES.find((s) => JSON.stringify(s.dash) === JSON.stringify(style.strokeDashArray))?.id ||
    'solid'

  return (
    <div className="space-y-3">
      <SectionTitle>Tabel</SectionTitle>

      <FieldRow label="Latar sel">
        <ColorPicker
          size="sm"
          align="right"
          label="Warna latar sel"
          allowNone
          value={typeof style.fill === 'string' ? style.fill : null}
          onChange={(c) => update({ fill: c })}
        />
      </FieldRow>

      <FieldRow label="Garis tabel">
        <ColorPicker
          size="sm"
          align="right"
          label="Warna garis tabel"
          value={typeof style.stroke === 'string' ? style.stroke : '#334155'}
          onChange={(c) => update({ stroke: c })}
        />
      </FieldRow>

      <FieldRow label="Warna teks">
        <ColorPicker
          size="sm"
          align="right"
          label="Warna teks tabel"
          value={typeof style.textColor === 'string' ? style.textColor : '#0f172a'}
          onChange={(c) => update({ textColor: c })}
        />
      </FieldRow>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Ketebalan garis</p>
        <SliderInput
          min={0}
          max={20}
          step={1}
          value={style.strokeWidth}
          onChange={(v) => update({ strokeWidth: v })}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Jenis garis</p>
        <div className="flex gap-1.5">
          {STROKE_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => update({ strokeDashArray: s.dash })}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] transition ${
                dashId === s.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <FieldRow label="Ukuran teks">
        <NumberInput
          className="w-20"
          value={style.fontSize}
          min={6}
          max={200}
          onChange={(v) => update({ fontSize: v })}
        />
      </FieldRow>

      <p className="rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
        Klik dua kali sebuah sel di kanvas untuk mengetik isinya.
      </p>
    </div>
  )
}

function ImageProperties({ target, update, onRequestCrop }) {
  /**
   * Menerapkan mask bentuk memakai clipPath relatif terhadap gambar.
   * Bentuknya diambil dari katalog bingkai supaya pilihannya konsisten
   * dengan bingkai di tab Elemen.
   */
  const applyMask = (shapeId) => {
    if (shapeId === 'none') {
      update({ clipPath: null, legFrameId: null })
      return
    }
    update({
      clipPath: createClipShape(shapeId, target.width, target.height),
      legFrameId: shapeId,
    })
  }

  return (
    <div className="space-y-3">
      <SectionTitle>Gambar</SectionTitle>

      <Button size="sm" variant="secondary" className="w-full" onClick={() => onRequestCrop?.(target)}>
        <Crop size={14} /> Crop / potong gambar
      </Button>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-500">Potong ke bentuk</p>
        <div className="grid grid-cols-3 gap-1.5">
          {MASK_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => applyMask(shape.id)}
              className={`rounded-lg border px-1.5 py-1.5 text-[10px] leading-tight transition ${
                (target.legFrameId || 'none') === shape.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-200 text-ink-600 hover:border-brand-400 hover:bg-brand-50'
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Garis tepi</p>
        <div className="flex items-center gap-2">
          <ColorPicker
            size="sm"
            align="right"
            label="Warna garis tepi"
            allowNone
            value={typeof target.stroke === 'string' ? target.stroke : null}
            onChange={(c) => update({ stroke: c, strokeWidth: c ? target.strokeWidth || 6 : 0 })}
          />
          <SliderInput
            min={0}
            max={40}
            step={1}
            value={target.strokeWidth || 0}
            onChange={(v) => update({ strokeWidth: v, stroke: target.stroke || '#ffffff' })}
          />
        </div>
      </div>
    </div>
  )
}

function TransformProperties({ target, update, canvas }) {
  return (
    <div className="space-y-3">
      <SectionTitle>Posisi & ukuran</SectionTitle>

      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="X">
          <NumberInput value={target.left || 0} onChange={(v) => update({ left: v })} />
        </FieldRow>
        <FieldRow label="Y">
          <NumberInput value={target.top || 0} onChange={(v) => update({ top: v })} />
        </FieldRow>
        <FieldRow label="L">
          <NumberInput
            value={target.getScaledWidth()}
            min={1}
            onChange={(v) => update({ scaleX: Math.max(0.01, v / target.width) })}
          />
        </FieldRow>
        <FieldRow label="T">
          <NumberInput
            value={target.getScaledHeight()}
            min={1}
            onChange={(v) => update({ scaleY: Math.max(0.01, v / target.height) })}
          />
        </FieldRow>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Rotasi</p>
        <SliderInput
          min={0}
          max={360}
          step={1}
          value={Math.round(target.angle || 0)}
          onChange={(v) => {
            target.rotate(v)
            canvas?.requestRenderAll()
            update({})
          }}
          suffix="°"
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-ink-500">Transparansi</p>
        <SliderInput
          min={0}
          max={1}
          step={0.01}
          value={target.opacity ?? 1}
          onChange={(v) => update({ opacity: v })}
        />
      </div>
    </div>
  )
}
