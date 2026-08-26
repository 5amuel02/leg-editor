/**
 * Konstanta global aplikasi: preset ukuran kanvas, font, preset teks,
 * definisi bentuk, dan konfigurasi brush.
 * Semua nilai di sini murni statis supaya aplikasi tetap jalan offline.
 */

/** Preset ukuran kanvas yang ditawarkan saat membuat desain baru. */
export const CANVAS_PRESETS = [
  {
    id: 'ig-post',
    label: 'Instagram Post',
    sub: '1080 × 1080 px',
    width: 1080,
    height: 1080,
    icon: 'square',
  },
  {
    id: 'ig-story',
    label: 'Instagram Story',
    sub: '1080 × 1920 px',
    width: 1080,
    height: 1920,
    icon: 'portrait',
  },
  {
    id: 'a4',
    label: 'Dokumen A4',
    sub: '2480 × 3508 px (300 dpi)',
    width: 2480,
    height: 3508,
    icon: 'portrait',
  },
  {
    id: 'presentation',
    label: 'Presentasi 16:9',
    sub: '1920 × 1080 px',
    width: 1920,
    height: 1080,
    icon: 'landscape',
  },
  {
    id: 'poster',
    label: 'Poster',
    sub: '1414 × 2000 px',
    width: 1414,
    height: 2000,
    icon: 'portrait',
  },
  {
    id: 'yt-thumb',
    label: 'Thumbnail YouTube',
    sub: '1280 × 720 px',
    width: 1280,
    height: 720,
    icon: 'landscape',
  },
]

/**
 * Shortcut jenis desain yang tampil di dashboard (visual saja, seperti Canva).
 * Diklik -> langsung membuat desain baru dengan ukuran terkait.
 */
export const DESIGN_SHORTCUTS = [
  { id: 'ig-post', label: 'Instagram Post', gradient: 'from-pink-500 to-rose-500', ratio: 'aspect-square' },
  { id: 'ig-story', label: 'Story', gradient: 'from-fuchsia-500 to-purple-600', ratio: 'aspect-[9/16]' },
  { id: 'presentation', label: 'Presentasi', gradient: 'from-sky-500 to-blue-600', ratio: 'aspect-video' },
  { id: 'a4', label: 'Dokumen A4', gradient: 'from-emerald-500 to-teal-600', ratio: 'aspect-[1/1.414]' },
  { id: 'poster', label: 'Poster', gradient: 'from-amber-500 to-orange-600', ratio: 'aspect-[1/1.414]' },
  { id: 'yt-thumb', label: 'Thumbnail YT', gradient: 'from-red-500 to-rose-600', ratio: 'aspect-video' },
]

/** Daftar font aman yang pasti tersedia offline (system font stack). */
export const FONT_FAMILIES = [
  'Inter, sans-serif',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Tahoma',
  'Impact',
  'Comic Sans MS',
  'Segoe UI',
]

/** Preset teks siap pakai pada tab "Teks". */
export const TEXT_PRESETS = [
  {
    id: 'heading',
    label: 'Tambahkan judul',
    preview: 'Judul Besar',
    previewClass: 'text-2xl font-bold',
    style: { fontSize: 96, fontWeight: 'bold', fontFamily: 'Inter, sans-serif', text: 'Judul Anda' },
  },
  {
    id: 'subheading',
    label: 'Tambahkan subjudul',
    preview: 'Subjudul medium',
    previewClass: 'text-lg font-semibold',
    style: { fontSize: 56, fontWeight: '600', fontFamily: 'Inter, sans-serif', text: 'Subjudul di sini' },
  },
  {
    id: 'body',
    label: 'Tambahkan teks isi',
    preview: 'Teks isi paragraf kecil',
    previewClass: 'text-sm font-normal',
    style: { fontSize: 32, fontWeight: 'normal', fontFamily: 'Inter, sans-serif', text: 'Tulis paragraf singkat di sini.' },
  },
]

/** Bentuk dasar pada tab "Elemen". */
export const SHAPES = [
  { id: 'rect', label: 'Kotak' },
  { id: 'rounded', label: 'Kotak Bulat' },
  { id: 'circle', label: 'Lingkaran' },
  { id: 'ellipse', label: 'Elips' },
  { id: 'triangle', label: 'Segitiga' },
  { id: 'diamond', label: 'Belah Ketupat' },
  { id: 'star', label: 'Bintang' },
  { id: 'hexagon', label: 'Segi Enam' },
  { id: 'line', label: 'Garis' },
  { id: 'arrow', label: 'Panah' },
]

/** Jenis brush pada tab "Alat". */
export const BRUSHES = [
  {
    id: 'pen',
    label: 'Pena',
    desc: 'Garis solid biasa',
    defaultWidth: 6,
    opacity: 1,
    strokeLineCap: 'round',
  },
  {
    id: 'highlighter',
    label: 'Stabilo',
    desc: 'Transparan, ujung kotak',
    defaultWidth: 28,
    opacity: 0.35,
    strokeLineCap: 'butt',
  },
  {
    id: 'marker',
    label: 'Spidol',
    desc: 'Tebal & pekat',
    defaultWidth: 18,
    opacity: 0.9,
    strokeLineCap: 'round',
  },
]

/** Palet warna cepat yang dipakai di banyak panel. */
export const SWATCHES = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78350f', '#1e293b',
]

/**
 * Palet cepat khusus tool menggambar (Pena/Stabilo/Spidol).
 * Dipilih manual — bukan hasil filter dari SWATCHES — supaya warna penting
 * seperti putih (untuk menulis di atas latar gelap) selalu ikut tampil.
 */
export const BRUSH_SWATCHES = [
  '#ffffff', '#000000', '#64748b', '#ef4444', '#f97316', '#f59e0b',
  '#facc15', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#d946ef', '#ec4899', '#78350f',
]

/** Style garis untuk stroke (dashArray). */
export const STROKE_STYLES = [
  { id: 'solid', label: 'Solid', dash: null },
  { id: 'dashed', label: 'Putus-putus', dash: [12, 8] },
  { id: 'dotted', label: 'Titik-titik', dash: [2, 6] },
]

/** Rasio crop cepat untuk gambar. */
export const CROP_RATIOS = [
  { id: 'free', label: 'Bebas', value: null },
  { id: '1-1', label: '1:1', value: 1 },
  { id: '4-5', label: '4:5', value: 4 / 5 },
  { id: '3-4', label: '3:4', value: 3 / 4 },
  { id: '16-9', label: '16:9', value: 16 / 9 },
  { id: '9-16', label: '9:16', value: 9 / 16 },
]

/** Level zoom preset pada toolbar atas. */
export const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3]

export const MIN_ZOOM = 0.05
export const MAX_ZOOM = 4

/** Ukuran thumbnail (lebar px) yang disimpan untuk halaman & project. */
export const THUMB_WIDTH = 240
