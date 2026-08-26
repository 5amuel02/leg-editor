/**
 * Service worker LEG Editor.
 *
 * Aplikasi ini memang sudah bekerja tanpa internet setelah dimuat, tapi
 * BERKAS aplikasinya tetap harus diambil dari server setiap kali dibuka.
 * Service worker menutup celah terakhir itu: setelah sekali dibuka, aplikasi
 * bisa dijalankan tanpa koneksi sama sekali dan bisa dipasang seperti
 * aplikasi biasa.
 *
 * Berkas ini sengaja polos tanpa build step — ia disalin apa adanya dari
 * `public/` sehingga isinya persis seperti yang dibaca di sini.
 */

const CACHE = 'leg-editor-v1'

/**
 * Kerangka minimum yang harus tersedia offline. Berkas hasil build tidak
 * didaftarkan di sini karena namanya mengandung hash yang berubah tiap build;
 * berkas-berkas itu masuk cache saat pertama kali diminta.
 */
const SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // `addAll` gagal seluruhnya bila satu berkas meleset, jadi tiap berkas
      // ditambahkan sendiri-sendiri: kerangka yang tidak lengkap masih jauh
      // lebih baik daripada instalasi yang batal total.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigasi memakai network-first supaya versi aplikasi yang baru di-deploy
  // langsung terpakai; cache hanya dipakai saat benar-benar offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    )
    return
  }

  // Aset lain memakai cache-first: namanya mengandung hash, jadi isi yang
  // sudah tersimpan tidak mungkin basi.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        }),
    ),
  )
})
