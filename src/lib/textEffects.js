/**
 * Efek teks siap pakai — dirancang terutama untuk judul/heading besar.
 *
 * Setiap efek hanyalah kombinasi properti Fabric bawaan (`shadow`, `stroke`,
 * `strokeWidth`, `paintFirst`, `textBackgroundColor`, `fill`), jadi hasilnya
 * ikut tersimpan ke JSON project dan ikut terekspor ke PNG/PDF tanpa
 * perlakuan khusus.
 *
 * Ukuran bayangan & ketebalan garis dihitung relatif terhadap `fontSize`
 * supaya efek terlihat sama proporsionalnya pada judul kecil maupun besar.
 */
import * as fabric from 'fabric'

/** Mengubah HEX menjadi rgba dengan alpha tertentu. */
export function withAlpha(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return hex || `rgba(0, 0, 0, ${alpha})`
  const [r, g, b] = [1, 2, 3].map((i) => parseInt(m[i], 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Mencampur sebuah warna ke arah hitam (rasio 0 = asli, 1 = hitam). */
function darken(hex, ratio) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return hex
  const parts = [1, 2, 3].map((i) => Math.round(parseInt(m[i], 16) * (1 - ratio)))
  return `#${parts.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Daftar efek.
 * `build({ u, s, accent, baseFill })` mengembalikan properti Fabric.
 *  - `u` : satuan relatif = fontSize / 100
 *  - `s` : intensitas 0..1
 *  - `accent`   : warna aksen pilihan user
 *  - `baseFill` : warna isi teks aslinya
 *
 * `preview` adalah gaya CSS untuk kotak contoh di panel (bukan untuk kanvas).
 */
export const TEXT_EFFECTS = [
  {
    id: 'none',
    label: 'Tanpa Efek',
    build: () => ({}),
    preview: () => ({}),
  },
  {
    id: 'lift',
    label: 'Lepas',
    build: ({ u, s, baseFill }) => ({
      fill: baseFill,
      shadow: new fabric.Shadow({
        color: `rgba(0, 0, 0, ${0.18 + 0.3 * s})`,
        blur: 14 * u * (0.5 + s),
        offsetX: 0,
        offsetY: 7 * u * (0.5 + s),
      }),
    }),
    preview: () => ({ textShadow: '0 4px 8px rgba(0,0,0,0.35)' }),
  },
  {
    id: 'glow',
    label: 'Bersinar',
    build: ({ u, s, accent, baseFill }) => ({
      fill: baseFill,
      shadow: new fabric.Shadow({
        color: accent,
        blur: 26 * u * (0.4 + s),
        offsetX: 0,
        offsetY: 0,
      }),
    }),
    preview: (accent) => ({ textShadow: `0 0 10px ${accent}, 0 0 18px ${accent}` }),
  },
  {
    id: 'echo',
    label: 'Echo',
    build: ({ u, s, accent, baseFill }) => ({
      fill: baseFill,
      shadow: new fabric.Shadow({
        color: withAlpha(accent, 0.55),
        blur: 0,
        offsetX: 11 * u * (0.4 + s),
        offsetY: 11 * u * (0.4 + s),
      }),
    }),
    preview: (accent) => ({ textShadow: `4px 4px 0 ${accent}88` }),
  },
  {
    id: 'outline',
    label: 'Kerangka',
    build: ({ u, s, accent, baseFill }) => ({
      fill: baseFill,
      stroke: accent,
      strokeWidth: 3.5 * u * (0.4 + s),
      paintFirst: 'stroke',
      strokeLineJoin: 'round',
    }),
    preview: (accent) => ({ WebkitTextStroke: `2px ${accent}`, paintOrder: 'stroke' }),
  },
  {
    id: 'background',
    label: 'Latar Belakang',
    build: ({ accent, baseFill }) => ({
      fill: baseFill,
      textBackgroundColor: accent,
    }),
    preview: (accent) => ({ background: accent, padding: '2px 6px', borderRadius: 4 }),
  },
  {
    id: 'splice',
    label: 'Splice',
    build: ({ u, s, accent, baseFill }) => ({
      fill: 'transparent',
      stroke: baseFill,
      strokeWidth: 2.8 * u * (0.4 + s),
      paintFirst: 'stroke',
      strokeLineJoin: 'round',
      shadow: new fabric.Shadow({
        color: accent,
        blur: 0,
        offsetX: 9 * u * (0.4 + s),
        offsetY: 9 * u * (0.4 + s),
      }),
    }),
    preview: (accent) => ({
      color: 'transparent',
      WebkitTextStroke: '1.5px currentColor',
      textShadow: `4px 4px 0 ${accent}`,
    }),
  },
  {
    id: 'hollow',
    label: 'Berongga',
    build: ({ u, s, baseFill }) => ({
      fill: 'transparent',
      stroke: baseFill,
      strokeWidth: 3 * u * (0.4 + s),
      paintFirst: 'stroke',
      strokeLineJoin: 'round',
    }),
    preview: () => ({ color: 'transparent', WebkitTextStroke: '1.5px currentColor' }),
  },
  {
    id: 'neon',
    label: 'Neon',
    build: ({ u, s, accent }) => ({
      fill: '#ffffff',
      stroke: accent,
      strokeWidth: 1.4 * u,
      paintFirst: 'stroke',
      shadow: new fabric.Shadow({
        color: accent,
        blur: 34 * u * (0.4 + s),
        offsetX: 0,
        offsetY: 0,
      }),
    }),
    preview: (accent) => ({
      color: '#fff',
      textShadow: `0 0 6px ${accent}, 0 0 14px ${accent}, 0 0 22px ${accent}`,
    }),
  },
  {
    id: 'glitch',
    label: 'Glitch',
    build: ({ u, s, baseFill }) => ({
      fill: baseFill,
      stroke: '#ff2d95',
      strokeWidth: 1.2 * u,
      paintFirst: 'stroke',
      shadow: new fabric.Shadow({
        color: '#22d3ee',
        blur: 0,
        offsetX: -7 * u * (0.4 + s),
        offsetY: 0,
      }),
    }),
    preview: () => ({ textShadow: '-3px 0 #22d3ee, 3px 0 #ff2d95' }),
  },

  /* ---------------- Efek tambahan untuk judul besar ---------------- */
  {
    id: 'shadow-bold',
    label: 'Bayangan Tebal',
    build: ({ u, s, baseFill }) => ({
      fill: baseFill,
      shadow: new fabric.Shadow({
        color: 'rgba(15, 23, 42, 0.85)',
        blur: 0,
        offsetX: 12 * u * (0.4 + s),
        offsetY: 12 * u * (0.4 + s),
      }),
    }),
    preview: () => ({ textShadow: '5px 5px 0 rgba(15,23,42,0.85)' }),
  },
  {
    id: 'outline-bold',
    label: 'Outline Tebal',
    build: ({ u, s, accent, baseFill }) => ({
      fill: baseFill,
      stroke: accent,
      strokeWidth: 9 * u * (0.4 + s),
      paintFirst: 'stroke',
      strokeLineJoin: 'round',
    }),
    preview: (accent) => ({ WebkitTextStroke: `5px ${accent}`, paintOrder: 'stroke' }),
  },
  {
    id: 'extrude',
    label: '3D Ekstrusi',
    build: ({ u, s, accent, baseFill }) => ({
      fill: baseFill,
      stroke: darken(accent, 0.35),
      strokeWidth: 1.5 * u,
      paintFirst: 'stroke',
      shadow: new fabric.Shadow({
        color: darken(accent, 0.2),
        blur: 0,
        offsetX: 16 * u * (0.4 + s),
        offsetY: 16 * u * (0.4 + s),
      }),
    }),
    preview: (accent) => ({
      textShadow: `2px 2px 0 ${accent}, 4px 4px 0 ${accent}, 6px 6px 0 ${accent}`,
    }),
  },
  {
    id: 'emboss',
    label: 'Emboss',
    build: ({ u, s, baseFill }) => ({
      fill: baseFill,
      stroke: 'rgba(255, 255, 255, 0.75)',
      strokeWidth: 1.6 * u,
      paintFirst: 'stroke',
      shadow: new fabric.Shadow({
        color: 'rgba(15, 23, 42, 0.55)',
        blur: 3 * u,
        offsetX: 3.5 * u * (0.5 + s),
        offsetY: 3.5 * u * (0.5 + s),
      }),
    }),
    preview: () => ({
      textShadow: '-1px -1px 0 rgba(255,255,255,0.9), 2px 2px 3px rgba(15,23,42,0.55)',
    }),
  },
  {
    id: 'sticker',
    label: 'Stiker',
    build: ({ u, s, baseFill }) => ({
      fill: baseFill,
      stroke: '#ffffff',
      strokeWidth: 10 * u * (0.4 + s),
      paintFirst: 'stroke',
      strokeLineJoin: 'round',
      shadow: new fabric.Shadow({
        color: 'rgba(15, 23, 42, 0.4)',
        blur: 8 * u,
        offsetX: 4 * u,
        offsetY: 6 * u,
      }),
    }),
    preview: () => ({
      WebkitTextStroke: '5px #ffffff',
      paintOrder: 'stroke',
      filter: 'drop-shadow(2px 3px 3px rgba(15,23,42,0.4))',
    }),
  },
  {
    id: 'block',
    label: 'Blok',
    build: ({ accent }) => ({
      fill: '#ffffff',
      textBackgroundColor: accent,
    }),
    preview: (accent) => ({
      background: accent,
      color: '#fff',
      padding: '2px 6px',
      borderRadius: 4,
    }),
  },
]

/** Properti yang selalu dikembalikan ke kondisi awal sebelum efek diterapkan. */
const RESET_PROPS = {
  shadow: null,
  stroke: null,
  strokeWidth: 0,
  paintFirst: 'fill',
  textBackgroundColor: '',
}

export const DEFAULT_EFFECT_COLOR = '#8b5cf6'
export const DEFAULT_EFFECT_STRENGTH = 50

/**
 * Menerapkan sebuah efek ke objek teks.
 * Warna isi asli disimpan di `legBaseFill` agar efek berongga/splice
 * (yang mengosongkan `fill`) tetap bisa dikembalikan.
 */
export function applyTextEffect(target, effectId, options = {}) {
  const effect = TEXT_EFFECTS.find((e) => e.id === effectId) || TEXT_EFFECTS[0]
  const accent = options.color || target.legEffectColor || DEFAULT_EFFECT_COLOR
  const strength = options.strength ?? target.legEffectStrength ?? DEFAULT_EFFECT_STRENGTH

  // Simpan warna isi asli selama masih berupa warna nyata.
  if (target.fill && target.fill !== 'transparent') target.legBaseFill = target.fill
  const baseFill = target.legBaseFill || '#1e293b'

  const props = effect.build({
    u: (target.fontSize || 48) / 100,
    s: strength / 100,
    accent,
    baseFill,
  })

  target.set({
    ...RESET_PROPS,
    fill: baseFill,
    ...props,
    legTextEffect: effect.id,
    legEffectColor: accent,
    legEffectStrength: strength,
  })
  target.setCoords()
  return target
}
