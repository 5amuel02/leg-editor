import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { useEditor } from '../../../context/EditorContext'
import { useToast } from '../../ui/Toast'
import { deleteUpload, listUploads, saveUpload } from '../../../lib/db'
import { getImageSize, readImageFile } from '../../../lib/exporters'
import { createImage } from '../../../lib/fabricUtils'
import { uid } from '../../../lib/project'
import Button from '../../ui/Button'

const MAX_FILE_MB = 12

/**
 * Tab "Unggahan": grid semua gambar yang pernah diunggah (tersimpan di
 * IndexedDB sebagai data URL) plus tombol unggah baru.
 * Gambar bisa diklik atau di-drag langsung ke kanvas.
 */
export default function UploadsPanel() {
  const { addObject, size, activePage } = useEditor()
  const toast = useToast()
  const inputRef = useRef(null)

  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const locked = !!activePage?.locked

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setUploads(await listUploads())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** Menyimpan berkas gambar terpilih ke penyimpanan lokal. */
  const handleFiles = async (files) => {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (images.length === 0) return

    setBusy(true)
    try {
      for (const file of images) {
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          toast.error(`"${file.name}" lebih dari ${MAX_FILE_MB} MB dan dilewati.`)
          continue
        }
        const dataUrl = await readImageFile(file)
        const dim = await getImageSize(dataUrl)
        await saveUpload({
          id: uid('img'),
          name: file.name,
          dataUrl,
          width: dim.width,
          height: dim.height,
          createdAt: Date.now(),
        })
      }
      await refresh()
      toast.success('Gambar tersimpan di penyimpanan lokal.')
    } catch {
      toast.error('Gagal menyimpan gambar. Penyimpanan browser mungkin penuh.')
    } finally {
      setBusy(false)
    }
  }

  /** Menambahkan gambar ke kanvas (klik thumbnail). */
  const handleAdd = async (item) => {
    if (locked) return
    const img = await createImage(item.dataUrl, size.width, size.height, item.name)
    addObject(img)
  }

  const handleDelete = async (item, e) => {
    e.stopPropagation()
    await deleteUpload(item.id)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <Button className="w-full" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        Unggah gambar
      </Button>

      {locked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Halaman terkunci — gambar tidak bisa ditambahkan.
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-ink-100" />
          ))}
        </div>
      ) : uploads.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-300 py-10 text-center">
          <ImagePlus size={28} className="text-ink-300" />
          <p className="mt-2 text-xs font-medium text-ink-500">Belum ada gambar</p>
          <p className="mt-0.5 px-4 text-[11px] text-ink-400">
            Unggah dari perangkat. Semua gambar disimpan di browser, tidak dikirim ke mana pun.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {uploads.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(e) => {
                  // Payload dipakai CanvasStage untuk menaruh gambar di titik drop.
                  e.dataTransfer.setData(
                    'application/leg-image',
                    JSON.stringify({ dataUrl: item.dataUrl, name: item.name }),
                  )
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onClick={() => handleAdd(item)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd(item)}
                className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-ink-200 bg-ink-50 transition hover:border-brand-400 active:cursor-grabbing"
              >
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                <button
                  type="button"
                  onClick={(e) => handleDelete(item, e)}
                  aria-label={`Hapus ${item.name}`}
                  className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-md bg-white/90 text-red-600 shadow group-hover:flex hover:bg-white"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-400">
            Klik gambar untuk menaruhnya di tengah kanvas, atau seret ke posisi yang diinginkan.
            Crop tersedia lewat toolbar saat gambar terpilih.
          </p>
        </>
      )}
    </div>
  )
}
