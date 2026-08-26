# Legza

Editor desain grafis sederhana yang berjalan **sepenuhnya di browser komputer sendiri**.
Tidak ada backend, tidak ada database online, tidak ada request jaringan sama sekali —
seluruh project dan gambar unggahan disimpan di IndexedDB/localStorage milik browser.

Dibangun dengan **React (Vite) + Fabric.js + Tailwind CSS**.

---

## Merek & tema

Warna merek diambil langsung dari logo: **`#e11620`**.

| Aset | Berkas | Dipakai untuk |
| --- | --- | --- |
| Logo penuh | `public/logo.png` | Arsip merek (tanda + wordmark, bersusun) |
| Tanda saja | `public/logo-mark.png` | Header dashboard, bilah editor, watermark hero |
| Ikon aplikasi | `public/icon-192.png`, `public/icon-512.png` | Manifest PWA, apple-touch-icon |
| Favicon | `public/favicon-32.png` | Tab browser |

Logo aslinya **bersusun ke bawah** (tanda di atas, wordmark di bawah). Di header
setinggi 36 px, wordmark bawaannya akan mengecil sampai tidak terbaca — jadi yang
dipakai di sana adalah tandanya saja, disandingkan dengan wordmark "Legza" yang
dirender sebagai teks. Kelas `.brand-wordmark` meniru karakter brush logo lewat
font sistem: bobot 800, tracking rapat, dan kemiringan italic. Tidak ada webfont
yang diunduh — aplikasi ini berjanji tidak pernah melakukan request jaringan.

Seluruh warna UI mengalir dari satu ramp `--color-brand-*` di `src/index.css`,
sehingga tombol, tab aktif, cincin fokus, border terpilih, dan ikon aksen ikut
berubah hanya dengan mengganti ramp itu. Kontras sudah diperiksa terhadap
WCAG AA: putih di atas `brand-600` 4,85:1, putih di atas `brand-700` 7,0:1, dan
`brand-700` di atas `brand-50` 6,6:1.

Dua warna sengaja **tidak** ikut merah:

- **Garis bantu smart guide** tetap pink `#ff2d95`, dan **badge pengukuran**
  memakai hitam netral. Keduanya digambar di atas karya pengguna yang bisa
  berwarna apa saja — termasuk merah — jadi keduanya harus kontras terhadap
  isi kanvas, bukan senada dengan merek.
- **Toast berhasil** tetap hijau, karena itu warna semantik, bukan merek.

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
npm test          # vitest (modul murni di src/lib)
```

### Pasang sebagai aplikasi

Hasil `npm run build` sudah berupa PWA: setelah sekali dibuka, aplikasi bisa
dijalankan **tanpa koneksi sama sekali** dan bisa dipasang lewat ikon install
di bilah alamat browser. Service worker hanya aktif pada build produksi —
di `npm run dev` ia sengaja tidak didaftarkan supaya tidak mengganggu hot reload.

---

## Alur pemakaian

1. **Dashboard** — tombol *Buat Desain Baru*, kolom pencarian project tersimpan,
   shortcut ukuran populer, dan grid thumbnail project terbaru.
2. **Pilih ukuran kanvas** — tiga tab: **Preset** (Instagram Post 1080×1080,
   Instagram Story, Dokumen A4 300 dpi, Presentasi 1920×1080, Poster, Thumbnail
   YouTube), **Template** (enam desain siap pakai, lihat di bawah), atau
   **Ukuran Custom**. Semua halaman dalam satu project memakai ukuran ini.
3. **Editor** — sidebar kiri (tab), kanvas di tengah, panel properti di kanan,
   panel navigasi halaman di bawah kanvas.

---

## Fitur

### Sidebar kiri

| Tab | Isi |
| --- | --- |
| **Elemen** | Bentuk dasar (kotak, kotak sudut bulat, lingkaran, elips, segitiga, belah ketupat, bintang, segi enam, garis, panah), 9 varian balon chat, dan 30 bingkai gambar dalam kategori Bentuk Dasar / Perangkat / Kertas. |
| **Teks** | Tombol kotak teks polos + preset judul (besar-bold), subjudul (medium), dan teks isi (kecil), serta pengelola **font kustom**. |
| **Unggahan** | Grid semua gambar yang pernah diunggah (tersimpan lokal), tombol unggah baru, klik atau seret ke kanvas. Gambar yang ditempel lewat `Ctrl+V` ikut masuk ke sini otomatis. |
| **Alat** | Tiga jenis brush (pena, stabilo transparan, spidol tebal) dengan warna & ketebalan custom — palet cepatnya memuat putih untuk menggambar di atas latar gelap — penghapus coretan, dan pembuat tabel baris × kolom. |
| **Layer** | Daftar semua elemen halaman aktif: reorder, sembunyi/tampil, kunci/buka, duplikat, hapus. |

### Toolbar kontekstual (muncul di atas elemen terpilih)

Tombolnya menyesuaikan jenis elemen: **Edit**, **Crop** (khusus gambar),
**Flip horizontal/vertical**, **warna isi**, **pengaturan garis** (warna, ketebalan,
solid/putus-putus/titik-titik), **Posisi** (rata kiri–tengah–kanan–atas–bawah serta
bawa ke depan / kirim ke belakang), **Format Painter**, duplikat, dan hapus.

### Template

Enam desain siap pakai di tab **Template**: Promo Diskon, Kartu Kutipan,
Sampul Presentasi, Thumbnail YouTube, Story Pengumuman, dan Dokumen A4.
Masing-masing membawa ukuran kanvas bawaannya sendiri.

Template ditulis dengan koordinat ternormalisasi (0–1 terhadap sisi kanvas),
bukan sebagai JSON Fabric mentah — satu definisi ikut menskala ke ukuran kanvas
mana pun, dan pratinjau di modal digambar dari deskriptor yang sama sehingga
tidak mungkin melenceng dari hasil aslinya.

### Font kustom

Tab **Teks** punya bagian *Font kustom*: muat berkas `.ttf`, `.otf`, `.woff`,
atau `.woff2` dari komputer sendiri (maksimal 6 MB per berkas). Font disimpan
lokal sebagai data URL dan didaftarkan lewat `FontFace` API — **tanpa satu pun
request jaringan**, jadi tidak melanggar prinsip offline aplikasi ini seperti
halnya menarik Google Fonts.

Setelah dimuat, font langsung muncul di dropdown font panel properti dengan
label "(kustom)". Font tersimpan di database terpisah (`leg-editor-fonts`)
supaya penambahannya tidak pernah menyentuh database project.

> **Catatan penamaan.** Nama produk adalah **Legza**, tapi kunci penyimpanan
> di browser (`leg-editor`, `leg-editor-fonts`, awalan localStorage
> `leg-editor:`) sengaja **tidak** ikut diganti. Kunci itu adalah alamat data,
> bukan merek: menggantinya akan membuat seluruh project, gambar unggahan, dan
> font milik pengguna lama tidak lagi bisa ditemukan.

### Grup

Pilih lebih dari satu elemen lalu **Ctrl+G** untuk menggabungkannya, atau
**Ctrl+Shift+G** untuk memecah grup terpilih. Tombolnya juga tersedia di
toolbar mengambang dan panel properti.

Urutan tumpukan dipertahankan saat menggabung, dan warna isi/garis diteruskan
ke seluruh isi grup. Tabel sengaja tidak bisa dipecah karena strukturnya
bergantung pada Group.

### Panel properti (kanan)

- Tanpa seleksi: nama halaman dan warna latar halaman.
- Teks: font (dengan pratinjau tipografi di dropdown), ukuran, warna,
  bold/italic/underline/coret, perataan, jarak baris & huruf, plus 16 preset
  **efek teks** lengkap dengan pemilih warna aksen dan slider intensitas.
- Bentuk: **warna isi dan warna garis diatur terpisah**, ketebalan, jenis garis,
  sudut membulat. Di toolbar mengambang keduanya tampil berdampingan — kotak
  terisi untuk warna isi, cincin untuk warna garis.
- **Isian gradien**: setiap elemen yang punya warna isi bisa diganti dari Solid
  ke Gradien, dengan warna awal, warna akhir, dan slider arah 0–360°.
- Tabel: latar sel, warna & ketebalan garis, warna teks, ukuran teks.
- Gambar: crop, potong ke 11 bentuk dari katalog bingkai, garis tepi, plus
  **penyesuaian** (lihat di bawah).
- Bingkai & balon chat: warna isi, garis, ketebalan, dan jenis garis.
- **Bayangan** untuk semua elemen non-teks: warna, kepekatan, blur, geser X/Y.
  Teks tidak memakai panel ini karena sudah punya 16 preset efeknya sendiri.
- Semua elemen: posisi X/Y, lebar/tinggi, rotasi, transparansi, rata elemen,
  serta **ratakan jarak** horizontal/vertikal saat 3 elemen atau lebih terpilih.

### Penyesuaian gambar

Panel gambar punya slider kecerahan, kontras, saturasi, vibrance, rona warna,
blur, noise, dan pixelate, plus tombol hitam putih / sepia / invert.

Semuanya memakai `fabric.filters` bawaan dan bersifat **non-destruktif** seperti
crop — yang tersimpan hanya angkanya, piksel asli gambar tidak pernah ditimpa.
Riwayat undo dicatat sekali per tarikan slider, bukan per piksel gerakan.

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
snap magnetis dalam radius 7px layar.

**Snapping juga bekerja saat elemen diresize**, dari handle sisi maupun sudut.
Tepi yang sedang ditarik menempel ke acuan yang sama, sementara tepi seberangnya
dijaga tetap di tempatnya. Saat rasio aspek terkunci (drag sudut), hanya tepi
terdekat yang menentukan faktor skala lalu diterapkan ke kedua sumbu, sehingga
rasionya tidak rusak. Elemen yang sudah diputar dilewati — pada objek berotasi,
skala bekerja di sumbu lokal elemen sehingga tidak lagi bersesuaian dengan tepi
kotak batas yang sejajar layar.

Rotasi ikut snap ke kelipatan 45° (0°/45°/90°/…). Tahan **Ctrl/Cmd** saat
menggeser, meresize, atau memutar untuk mematikan snap sementara, atau matikan
sepenuhnya lewat tombol magnet di toolbar atas. Garis bantu hilang sendiri
begitu elemen dilepas.

### Indikator ukuran & posisi

Badge angka muncul di dekat elemen selama interaksi berlangsung, sehingga ukuran
dan posisi bisa diatur presisi tanpa menebak:

| Sedang | Ditampilkan |
| --- | --- |
| Menggeser | `X 300   Y 346` — posisi sudut kiri-atas |
| Meresize | `557 × 302` — lebar × tinggi saat itu juga |
| Memutar | `45°` — sudut saat itu juga |

Badge diletakkan di bawah elemen, atau di atasnya bila ruang di bawah sudah
habis, dan hilang bersama garis bantu begitu tombol mouse dilepas.

### Indikator jarak

Saat elemen digeser dan sebuah garis bantu muncul, angka jarak (px) ikut
tampil di sepanjang garis ukur — mirip Figma:

| Acuan snap | Yang diukur |
| --- | --- |
| Elemen lain | Celah antara kedua elemen, diukur tegak lurus terhadap garis bantu |
| Tepi/tengah kanvas | Margin elemen ke kedua tepi kanvas pada sumbu garis bantu |

Arah pengukurannya selalu tegak lurus terhadap garis bantu, dan itu memang yang
bermakna: garis bantu tegak berarti kedua elemen sudah sejajar mendatar, jadi
yang tersisa untuk diukur adalah celah tegak di antara keduanya. Bila kedua
elemen saling tumpang tindih pada sumbu itu, tidak ada celah dan labelnya tidak
ditampilkan. Margin bernilai nol juga dilewati — angka "0" saat elemen menempel
di tepi kanvas hanya menambah keriuhan.

Saat elemen snap ke tengah kanvas, dua angka yang sama besar di kiri dan kanan
menjadi konfirmasi bahwa posisinya benar-benar di tengah.

Selama menggeser, meresize, atau memutar, **toolbar mengambang disembunyikan**.
Toolbar itu melayang tepat di atas elemen terpilih — persis tempat label jarak
muncul saat dua elemen bertumpuk tegak — jadi tanpa ini angkanya tertutup.

### Multi-halaman

Tambah, duplikat, hapus, sembunyikan, kunci, dan geser urutan halaman lewat panel
navigasi di bawah kanvas — lengkap dengan thumbnail per halaman dan indikator
"Halaman 2/4". Halaman yang disembunyikan otomatis dilewati saat ekspor.

### Toolbar atas

Undo/redo, zoom in/out dengan slider persentase dan tombol sesuaikan layar,
ekspor, simpan, serta indikator status auto-save.

### Ekspor & penyimpanan

- Pilih **resolusi 1x / 2x / 3x** sekali di atas menu ekspor — pilihan itu
  berlaku untuk ketiga tombol di bawahnya.
- **PNG** halaman yang sedang aktif.
- **PNG massal** untuk semua halaman sekaligus.
- **PDF multi-halaman** berukuran persis mengikuti dimensi kanvas.
- **Berkas project `.json`** berisi seluruh halaman — bisa diunduh dan dimuat kembali
  lewat dashboard ("Buka File") maupun dari dalam editor.
- **Auto-save** berkala ke IndexedDB, plus simpan otomatis saat editor ditutup.

Ekspor dirender di offscreen canvas pada skala 100%, sehingga hasilnya tidak
terpengaruh zoom/pan yang sedang aktif dan halaman non-aktif pun ikut terekspor.

---

## Pintasan keyboard

Daftar lengkapnya juga tersedia di dalam aplikasi: klik ikon **?** di toolbar
atas (di sebelah tombol magnet) untuk membuka panel "Pintasan keyboard",
dikelompokkan per kategori. Tutup lewat tombol X, klik di luar panel, atau
`Esc`. Isinya dibaca dari `src/lib/shortcuts.js` dan dijaga test agar tidak
melenceng dari pintasan yang benar-benar ditangani `useShortcuts`.

Selama sebuah modal terbuka, pintasan sengaja tidak diteruskan ke kanvas —
tanpa itu, menekan `Ctrl+D` sambil membaca panel Bantuan akan diam-diam
menduplikat elemen di baliknya.

| Pintasan | Fungsi |
| --- | --- |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo |
| `Ctrl+C` | Salin elemen terpilih |
| `Ctrl+V` | Tempel gambar dari clipboard sistem ke kanvas (otomatis tersimpan ke Unggahan), atau tempel elemen yang tadi disalin |
| `Ctrl+D` | Duplikat elemen |
| `Ctrl+G` / `Ctrl+Shift+G` | Gabungkan jadi grup / pecah grup |
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
    snapping.js      smart guides: snap saat geser, resize, dan rotasi
    measurement.js   badge angka ukuran/posisi selama interaksi
    shadow.js        bayangan elemen non-teks
    gradient.js      isian gradien linear
    imageFilters.js  penyesuaian gambar (brightness, kontras, dst)
    fonts.js         font kustom: simpan, daftarkan lewat FontFace
    templates.js     katalog template & perakit halamannya
    shortcuts.js     katalog pintasan keyboard untuk panel Bantuan
    exporters.js     render PNG/PDF dan unduh/baca berkas
    *.test.js        test vitest untuk modul murni di atas
  context/
    EditorContext.jsx  state editor: halaman, seleksi, undo/redo, auto-save
  hooks/
    useShortcuts.js       pintasan keyboard
    useClipboardPaste.js  tempel gambar dari clipboard sistem
    useCustomFonts.js     daftar font kustom untuk panel & dropdown
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
  menghapus project **dan font kustom** — ekspor berkas `.json` untuk cadangan.
- Bayangan diterapkan pada grup, bukan pada tiap anggotanya. Memecah grup yang
  punya bayangan akan melepas bayangan itu, sama seperti aplikasi desain lain
  yang memperlakukan efek sebagai milik grup.
- Penghapus di tab Alat sengaja hanya menghapus coretan bebas; teks, bentuk, dan
  gambar dihapus lewat tombol Hapus atau tombol `Delete`.
- Crop bersifat non-destruktif (memakai `cropX`/`cropY`), jadi bisa diatur ulang
  kapan saja tanpa kehilangan bagian gambar yang terpotong.
