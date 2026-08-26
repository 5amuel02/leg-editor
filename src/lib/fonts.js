/**
 * Font kustom yang diunggah pengguna.
 *
 * Berkas font disimpan sebagai data URL di IndexedDB lalu didaftarkan ke
 * dokumen memakai `FontFace` API. Tidak ada satu pun request jaringan —
 * ini justru menegakkan janji "sepenuhnya offline" di README, berbeda
 * dengan menarik Google Fonts yang butuh internet.
 *
 * Alur:
 *   unggah  -> simpan data URL -> registerFont() -> tersedia di dropdown
 *   startup -> loadCustomFonts() -> semua font tersimpan didaftarkan ulang
 */
import { listFonts, saveFont, deleteFont } from './db'
import { uid } from './project'

/** Format yang bisa dipakai langsung oleh browser lewat FontFace. */
export const ACCEPTED_FONT_EXT = ['.ttf', '.otf', '.woff', '.woff2']
export const MAX_FONT_MB = 6

/** Dipancarkan setelah daftar font berubah supaya panel & dropdown menyegarkan diri. */
export const FONTS_CHANGED_EVENT = 'leg:fonts-changed'

export function notifyFontsChanged() {
  window.dispatchEvent(new CustomEvent(FONTS_CHANGED_EVENT))
}

/**
 * Nama keluarga font diturunkan dari nama berkas.
 * "Roboto-BoldItalic.ttf" -> "Roboto BoldItalic"
 *
 * Karakter kutip dan koma dibuang karena keduanya punya arti khusus di
 * dalam nilai CSS `font-family` dan akan merusak render bila diloloskan.
 */
export function familyFromFilename(filename) {
  // Bukan `filename || 'Font'`: nilai pengganti di sini akan melewati jalur
  // cadangan di bawah dan menghasilkan nama berbeda untuk nama berkas kosong.
  const base = String(filename ?? '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/["',]/g, '')
    .trim()
  return base || 'Font Kustom'
}

/** Apakah ekstensi berkas termasuk format font yang didukung. */
export function isFontFile(filename) {
  const lower = String(filename || '').toLowerCase()
  return ACCEPTED_FONT_EXT.some((ext) => lower.endsWith(ext))
}

/** Membaca berkas font menjadi data URL. */
export function readFontFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('Gagal membaca berkas font.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Mendaftarkan satu font ke dokumen.
 * Aman dipanggil berulang: `document.fonts` mengabaikan duplikat yang identik,
 * dan kegagalan satu font tidak boleh menjatuhkan yang lain.
 */
/**
 * Family yang sudah terdaftar ATAU sedang dalam proses pendaftaran.
 *
 * Memeriksa `document.fonts` saja tidak cukup: `face.load()` menunggu, jadi
 * dua pemanggilan bersamaan (React StrictMode menjalankan efek dua kali di
 * mode dev) sama-sama lolos pemeriksaan sebelum salah satunya sempat
 * menambahkan font, dan family yang sama masuk dua kali.
 */
const registered = new Set()

export async function registerFont(family, dataUrl) {
  if (!family || !dataUrl || typeof FontFace === 'undefined') return false
  if (registered.has(family)) return true
  registered.add(family)

  try {
    const face = new FontFace(family, `url(${dataUrl})`)
    await face.load()
    document.fonts.add(face)
    return true
  } catch {
    registered.delete(family)
    return false
  }
}

/**
 * Mendaftarkan ulang seluruh font tersimpan. Dipanggil sekali saat aplikasi
 * dimuat — tanpa ini, teks yang memakai font kustom akan jatuh ke font
 * pengganti setelah halaman di-refresh.
 *
 * Mengembalikan daftar family yang berhasil didaftarkan.
 */
export async function loadCustomFonts() {
  let fonts = []
  try {
    fonts = await listFonts()
  } catch {
    return []
  }
  const results = await Promise.all(
    fonts.map(async (f) => ((await registerFont(f.family, f.dataUrl)) ? f.family : null)),
  )
  return results.filter(Boolean)
}

/**
 * Menyimpan sebuah berkas font lalu langsung mendaftarkannya.
 * Melempar Error dengan pesan siap tampil bila berkas ditolak.
 */
export async function addFontFile(file) {
  if (!isFontFile(file.name)) {
    throw new Error(`Format "${file.name}" tidak didukung. Pakai ${ACCEPTED_FONT_EXT.join(', ')}.`)
  }
  if (file.size > MAX_FONT_MB * 1024 * 1024) {
    throw new Error(`"${file.name}" lebih dari ${MAX_FONT_MB} MB.`)
  }

  const family = familyFromFilename(file.name)
  const dataUrl = await readFontFile(file)

  const ok = await registerFont(family, dataUrl)
  if (!ok) throw new Error(`"${file.name}" tidak bisa dibaca sebagai font.`)

  const record = { id: uid('font'), name: file.name, family, dataUrl, createdAt: Date.now() }
  await saveFont(record)
  notifyFontsChanged()
  return record
}

/**
 * Menghapus font dari penyimpanan.
 *
 * Font yang sudah terlanjur didaftarkan TIDAK dicabut dari dokumen: teks di
 * project yang masih memakainya akan tetap tampil benar selama sesi ini.
 * Setelah refresh, font itu memang hilang dan teks jatuh ke font pengganti —
 * perilaku yang sama seperti menghapus gambar dari pustaka unggahan.
 */
export async function removeFont(id) {
  await deleteFont(id)
  notifyFontsChanged()
}
