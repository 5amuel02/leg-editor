/**
 * Katalog pintasan keyboard editor.
 *
 * Ditulis sebagai data, bukan JSX, supaya menjadi satu-satunya sumber
 * kebenaran: panel Bantuan merendernya, dan test memeriksanya tidak melenceng
 * dari pintasan yang benar-benar ditangani `useShortcuts`.
 *
 * `keys` adalah satu kombinasi tombol. `alt` diisi bila aksi yang sama punya
 * kombinasi kedua yang juga bekerja.
 */

export const SHORTCUT_GROUPS = [
  {
    id: 'umum',
    label: 'Umum',
    items: [
      { action: 'Urungkan', keys: ['Ctrl', 'Z'] },
      { action: 'Ulangi', keys: ['Ctrl', 'Shift', 'Z'], alt: ['Ctrl', 'Y'] },
      { action: 'Salin elemen terpilih', keys: ['Ctrl', 'C'] },
      {
        action: 'Tempel',
        keys: ['Ctrl', 'V'],
        note: 'Gambar dari clipboard sistem, atau elemen yang tadi disalin',
      },
      { action: 'Simpan ke browser', keys: ['Ctrl', 'S'] },
    ],
  },
  {
    id: 'elemen',
    label: 'Elemen',
    items: [
      { action: 'Duplikat', keys: ['Ctrl', 'D'] },
      { action: 'Hapus', keys: ['Delete'], alt: ['Backspace'] },
      { action: 'Gabungkan jadi grup', keys: ['Ctrl', 'G'] },
      { action: 'Pecah grup', keys: ['Ctrl', 'Shift', 'G'] },
      { action: 'Geser 1 px', keys: ['↑', '↓', '←', '→'] },
      { action: 'Geser 10 px', keys: ['Shift', '↑ ↓ ← →'] },
      {
        action: 'Tulis teks di dalam bentuk',
        keys: ['dobel-klik'],
        note: 'Pada bentuk atau balon chat; teksnya ikut bergerak dan menyesuaikan ukuran',
      },
    ],
  },
  {
    id: 'teks',
    label: 'Teks',
    items: [
      { action: 'Perbesar ukuran font', keys: ['Ctrl', 'Shift', '>'], note: 'Naik 2 px tiap tekan' },
      { action: 'Perkecil ukuran font', keys: ['Ctrl', 'Shift', '<'], note: 'Turun 2 px tiap tekan' },
    ],
  },
  {
    id: 'navigasi',
    label: 'Navigasi',
    items: [
      { action: 'Perbesar', keys: ['Ctrl', '+'] },
      { action: 'Perkecil', keys: ['Ctrl', '−'] },
      { action: 'Sesuaikan layar', keys: ['Ctrl', '0'] },
      { action: 'Zoom di area kanvas', keys: ['Ctrl', 'scroll'] },
      { action: 'Geser area kerja', keys: ['scroll dua jari'], note: 'Ke segala arah' },
      { action: 'Geser area kerja dengan mouse', keys: ['Spasi', 'seret'] },
      { action: 'Geser mendatar', keys: ['Shift', 'scroll'] },
    ],
  },
  {
    id: 'mode',
    label: 'Mode & bantuan visual',
    items: [
      {
        action: 'Keluar mode gambar / batalkan seleksi',
        keys: ['Esc'],
        note: 'Juga membatalkan format painter dan mode mengetik teks',
      },
      {
        action: 'Matikan snap sementara',
        keys: ['Ctrl'],
        note: 'Ditahan sambil menggeser, meresize, atau memutar elemen',
      },
    ],
  },
]

/** Jumlah seluruh pintasan yang terdaftar — dipakai test dan ringkasan panel. */
export function countShortcuts() {
  return SHORTCUT_GROUPS.reduce((total, group) => total + group.items.length, 0)
}
