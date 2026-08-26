/**
 * Lapisan penyimpanan lokal.
 *
 * - IndexedDB dipakai untuk data berat: project (beserta seluruh halaman)
 *   dan gambar hasil unggahan (base64 data URL).
 * - localStorage dipakai untuk metadata ringan: id project terakhir dibuka,
 *   preferensi UI, dan penanda auto-save.
 *
 * Tidak ada request jaringan sama sekali di file ini — semuanya lokal.
 */

const DB_NAME = 'leg-editor'
const DB_VERSION = 1
export const STORE_PROJECTS = 'projects'
export const STORE_UPLOADS = 'uploads'

let dbPromise = null

/** Membuka (dan membuat bila perlu) database IndexedDB. */
function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const s = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
        s.createIndex('updatedAt', 'updatedAt')
      }
      if (!db.objectStoreNames.contains(STORE_UPLOADS)) {
        const s = db.createObjectStore(STORE_UPLOADS, { keyPath: 'id' })
        s.createIndex('createdAt', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

/** Helper generik untuk menjalankan satu transaksi. */
async function tx(storeName, mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    let result
    try {
      result = fn(store)
    } catch (err) {
      reject(err)
      return
    }
    transaction.oncomplete = () => resolve(result?.result ?? result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function dbGetAll(storeName) {
  const req = await tx(storeName, 'readonly', (store) => store.getAll())
  return req || []
}

export async function dbGet(storeName, id) {
  return tx(storeName, 'readonly', (store) => store.get(id))
}

export async function dbPut(storeName, value) {
  await tx(storeName, 'readwrite', (store) => store.put(value))
  return value
}

export async function dbDelete(storeName, id) {
  await tx(storeName, 'readwrite', (store) => store.delete(id))
}

export async function dbClear(storeName) {
  await tx(storeName, 'readwrite', (store) => store.clear())
}

/* ------------------------------------------------------------------ */
/* API tingkat aplikasi                                                */
/* ------------------------------------------------------------------ */

/** Ambil semua project, terbaru di depan. */
export async function listProjects() {
  const all = await dbGetAll(STORE_PROJECTS)
  return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export async function getProject(id) {
  return dbGet(STORE_PROJECTS, id)
}

export async function saveProject(project) {
  const payload = { ...project, updatedAt: Date.now() }
  await dbPut(STORE_PROJECTS, payload)
  return payload
}

export async function deleteProject(id) {
  await dbDelete(STORE_PROJECTS, id)
}

/** Ambil semua gambar unggahan, terbaru di depan. */
export async function listUploads() {
  const all = await dbGetAll(STORE_UPLOADS)
  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function saveUpload(upload) {
  await dbPut(STORE_UPLOADS, upload)
  return upload
}

export async function deleteUpload(id) {
  await dbDelete(STORE_UPLOADS, id)
}

/* ------------------------------------------------------------------ */
/* localStorage helper (metadata ringan)                               */
/* ------------------------------------------------------------------ */

const LS_PREFIX = 'leg-editor:'

export function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage penuh / mode private — abaikan, bukan error fatal */
  }
}

export function lsRemove(key) {
  try {
    localStorage.removeItem(LS_PREFIX + key)
  } catch {
    /* abaikan */
  }
}
