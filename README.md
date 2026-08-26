# LEG Editor

Editor desain grafis sederhana yang berjalan **sepenuhnya di browser komputer sendiri**.
Tidak ada backend, tidak ada database online, tidak ada request jaringan sama sekali —
seluruh project dan gambar unggahan disimpan di IndexedDB/localStorage milik browser.

Dibangun dengan **React (Vite) + Fabric.js + Tailwind CSS**.

---

## Menjalankan

```bash
npm install
npm run dev
```

Aplikasi terbuka di `http://localhost:5173`. Tidak ada langkah setup tambahan —
tanpa file `.env`, tanpa service eksternal, tanpa koneksi internet setelah `npm install`.

Perintah lain:

```bash
npm run build     # build produksi ke folder dist/
npm run preview   # menjalankan hasil build secara lokal
npm run lint      # oxlint
```

---

## Alur pemakaian

1. **Dashboard** — tombol *Buat Desain Baru*, kolom pencarian project tersimpan,
   shortcut ukuran populer, dan grid thumbnail project terbaru.
2. **Pilih ukuran kanvas** — preset (Instagram Post 1080×1080, Instagram Story,
   Dokumen A4 300 dpi, Presentasi 1920×1080, Poster, Thumbnail YouTube) atau
   ukuran custom. Semua halaman dalam satu project memakai ukuran ini.
3. **Editor** — sidebar kiri (tab), kanvas di tengah, panel properti di kanan,
   panel navigasi halaman di bawah kanvas.

---

## Fitur

### Sidebar kiri

| Tab | Isi |
| --- | --- |
| **Elemen** | Kotak, kotak sudut bulat, lingkaran, elips, segitiga, belah ketupat, bintang, segi enam, garis, dan panah. Warna elemen baru bisa dipilih lebih dulu. |
| **Teks** | Tombol kotak teks polos + preset judul (besar-bold), subjudul (medium), dan teks isi (kecil). |
| **Unggahan** | Grid semua gambar yang pernah diunggah (tersimpan lokal), tombol unggah baru, klik atau seret ke kanvas. |
| **Alat** | Tiga jenis brush (pena, stabilo transparan, spidol tebal) dengan warna & ketebalan custom, penghapus coretan, dan pembuat tabel baris × kolom. |
| **Layer** | Daftar semua elemen halaman aktif: reorder, sembunyi/tampil, kunci/buka, duplikat, hapus. |

### Toolbar kontekstual (muncul di atas elemen terpilih)

Tombolnya menyesuaikan jenis elemen: **Edit**, **Crop** (khusus gambar),
**Flip horizontal/vertical**, **warna isi**, **pengaturan garis** (warna, ketebalan,
solid/putus-putus/titik-titik), **Posisi** (rata kiri–tengah–kanan–atas–bawah serta
bawa ke depan / kirim ke belakang), **Format Painter**, duplikat, dan hapus.

### Panel properti (kanan)

- Tanpa seleksi: nama halaman dan warna latar halaman.
- Teks: font, ukuran, warna, bold/italic/underline/coret, perataan, jarak baris & huruf.
- Bentuk: warna isi, garis, ketebalan, jenis garis, sudut membulat.
- Tabel: latar sel, warna & ketebalan garis, warna teks, ukuran teks.
- Gambar: crop, potong ke bentuk (lingkaran / sudut bulat / segitiga), garis tepi.
- Semua elemen: posisi X/Y, lebar/tinggi, rotasi, transparansi, rata elemen.

### Multi-halaman

Tambah, duplikat, hapus, sembunyikan, kunci, dan geser urutan halaman lewat panel
navigasi di bawah kanvas — lengkap dengan thumbnail per halaman dan indikator
"Halaman 2/4". Halaman yang disembunyikan otomatis dilewati saat ekspor.

### Toolbar atas

Undo/redo, zoom in/out dengan slider persentase dan tombol sesuaikan layar,
ekspor, simpan, serta indikator status auto-save.

### Ekspor & penyimpanan

- **PNG** per halaman dengan pengali 1x / 2x / 3x (resolusi tinggi).
- **PNG massal** untuk semua halaman sekaligus.
- **PDF multi-halaman** berukuran persis mengikuti dimensi kanvas.
- **Berkas project `.json`** berisi seluruh halaman — bisa diunduh dan dimuat kembali
  lewat dashboard ("Buka File") maupun dari dalam editor.
- **Auto-save** berkala ke IndexedDB, plus simpan otomatis saat editor ditutup.

Ekspor dirender di offscreen canvas pada skala 100%, sehingga hasilnya tidak
terpengaruh zoom/pan yang sedang aktif dan halaman non-aktif pun ikut terekspor.

---

## Pintasan keyboard

| Pintasan | Fungsi |
| --- | --- |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo |
| `Ctrl+C` / `Ctrl+V` | Salin / tempel elemen |
| `Ctrl+D` | Duplikat elemen |
| `Ctrl+S` | Simpan project ke browser |
| `Ctrl` + `+` / `-` / `0` | Perbesar / perkecil / sesuaikan layar |
| `Ctrl` + scroll | Zoom di area kanvas |
| `Delete` | Hapus elemen terpilih |
| `Esc` | Keluar dari mode gambar / batalkan seleksi |
| Panah (`Shift` = 10 px) | Geser elemen terpilih |

---

## Struktur project

```
src/
  lib/
    constants.js     preset ukuran, font, brush, palet warna
    project.js       model data project & halaman
    db.js            wrapper IndexedDB + helper localStorage
    fabricUtils.js   factory objek Fabric, kunci, snapshot, salin style
    exporters.js     render PNG/PDF dan unduh/baca berkas
  context/
    EditorContext.jsx  state editor: halaman, seleksi, undo/redo, auto-save
  hooks/
    useShortcuts.js    pintasan keyboard
  components/
    ui/                komponen dasar (Button, Modal, ColorPicker, Toast, Field)
    dashboard/         kartu project & modal pilih ukuran
    editor/            TopBar, CanvasStage, FloatingToolbar, PropertiesPanel,
                       PageNavigator, CropModal, dan panels/ untuk tiap tab
  pages/
    Dashboard.jsx
    EditorPage.jsx
```

---

## Catatan

- Data tersimpan per-browser dan per-profil. Menghapus data situs juga akan
  menghapus project — ekspor berkas `.json` untuk cadangan.
- Penghapus di tab Alat sengaja hanya menghapus coretan bebas; teks, bentuk, dan
  gambar dihapus lewat tombol Hapus atau tombol `Delete`.
- Crop bersifat non-destruktif (memakai `cropX`/`cropY`), jadi bisa diatur ulang
  kapan saja tanpa kehilangan bagian gambar yang terpotong.
