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
| **Elemen** | Bentuk dasar (kotak, kotak sudut bulat, lingkaran, elips, segitiga, belah ketupat, bintang, segi enam, garis, panah), 9 varian balon chat, dan 30 bingkai gambar dalam kategori Bentuk Dasar / Perangkat / Kertas. |
| **Teks** | Tombol kotak teks polos + preset judul (besar-bold), subjudul (medium), dan teks isi (kecil). |
| **Unggahan** | Grid semua gambar yang pernah diunggah (tersimpan lokal), tombol unggah baru, klik atau seret ke kanvas. |
| **Alat** | Tiga jenis brush (pena, stabilo transparan, spidol tebal) dengan warna & ketebalan custom — palet cepatnya memuat putih untuk menggambar di atas latar gelap — penghapus coretan, dan pembuat tabel baris × kolom. |
| **Layer** | Daftar semua elemen halaman aktif: reorder, sembunyi/tampil, kunci/buka, duplikat, hapus. |

### Toolbar kontekstual (muncul di atas elemen terpilih)

Tombolnya menyesuaikan jenis elemen: **Edit**, **Crop** (khusus gambar),
**Flip horizontal/vertical**, **warna isi**, **pengaturan garis** (warna, ketebalan,
solid/putus-putus/titik-titik), **Posisi** (rata kiri–tengah–kanan–atas–bawah serta
bawa ke depan / kirim ke belakang), **Format Painter**, duplikat, dan hapus.

### Panel properti (kanan)

- Tanpa seleksi: nama halaman dan warna latar halaman.
- Teks: font (dengan pratinjau tipografi di dropdown), ukuran, warna,
  bold/italic/underline/coret, perataan, jarak baris & huruf, plus 16 preset
  **efek teks** lengkap dengan pemilih warna aksen dan slider intensitas.
- Bentuk: warna isi, garis, ketebalan, jenis garis, sudut membulat.
- Tabel: latar sel, warna & ketebalan garis, warna teks, ukuran teks.
- Gambar: crop, potong ke 11 bentuk dari katalog bingkai, garis tepi.
- Bingkai & balon chat: warna isi, garis, ketebalan, dan jenis garis.
- Semua elemen: posisi X/Y, lebar/tinggi, rotasi, transparansi, rata elemen.

### Balon chat

Sembilan varian: kotak siku dan kotak bulat dengan ekor kiri/kanan, oval dengan
ekor kiri/kanan, balon pikiran kiri/kanan, serta balon teriakan. Semuanya bisa
diberi warna isi, garis tepi, dan ketebalan seperti bentuk biasa.

### Bingkai gambar

Tiga puluh bentuk bingkai dalam tiga kategori:

| Kategori | Bentuk |
| --- | --- |
| **Bentuk Dasar** | persegi panjang, sudut bulat, persegi, lingkaran, oval, kapsul, lengkung, segitiga, belah ketupat, segi lima, segi enam, segi delapan, bintang, hati, blob |
| **Perangkat** | ponsel (potret & mendatar), tablet, laptop, monitor, jam tangan, TV |
| **Kertas** | A4 potret, A4 lanskap, kertas sobek, tiket, catatan tempel, pita, label, amplop |

Bingkai kosong tampil sebagai siluet bergaris putus-putus. Untuk mengisinya:
pilih bingkai lalu klik gambar di tab Unggahan, atau seret gambar tepat ke atas
bingkai. Gambar otomatis dipotong "cover" mengikuti rasio bingkai lalu di-clip
mengikuti bentuknya — cropnya non-destruktif sehingga bisa diubah lagi kapan saja.

Bingkai berupa siluet utuh: pada bingkai perangkat, gambar mengisi seluruh
siluet termasuk kaki atau talinya, bukan hanya area layar.

### Efek teks

Enam belas preset yang dirancang untuk judul besar: Tanpa Efek, Lepas,
Bersinar, Echo, Kerangka, Latar Belakang, Splice, Berongga, Neon, Glitch,
Bayangan Tebal, Outline Tebal, 3D Ekstrusi, Emboss, Stiker, dan Blok. Setiap
efek punya pemilih warna aksen dan slider intensitas, dan ukurannya menyesuaikan
`fontSize` sehingga proporsinya tetap sama pada judul kecil maupun besar.

### Smart guides & snapping

Saat elemen digeser, garis bantu pink 1px muncul otomatis ketika elemen sejajar
dengan tepi kanvas, tengah kanvas, atau tepi/tengah elemen lain — lengkap dengan
snap magnetis dalam radius 7px layar. Rotasi ikut snap ke kelipatan 45°
(0°/45°/90°/…). Tahan **Ctrl/Cmd** saat menggeser atau memutar untuk mematikan
snap sementara, atau matikan sepenuhnya lewat tombol magnet di toolbar atas.
Garis bantu hilang sendiri begitu elemen dilepas.

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
| `Ctrl` / `Cmd` ditahan saat menggeser | Matikan smart guides & snap sementara |
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
    bubbles.js       path & factory balon chat
    frames.js        katalog bingkai, clipPath, dan pengisian gambar
    textEffects.js   preset efek teks
    snapping.js      perhitungan & penggambaran smart guides
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
