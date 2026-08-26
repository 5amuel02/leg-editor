import { useCallback, useEffect, useState } from 'react'
import { listFonts } from '../lib/db'
import { FONTS_CHANGED_EVENT } from '../lib/fonts'
import { FONT_FAMILIES } from '../lib/constants'

/**
 * Daftar font kustom yang tersimpan, ikut menyegarkan diri setiap kali
 * ada font ditambah atau dihapus (lewat `FONTS_CHANGED_EVENT`).
 */
export function useCustomFonts() {
  const [fonts, setFonts] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setFonts(await listFonts())
    } catch {
      setFonts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onChanged = () => refresh()
    window.addEventListener(FONTS_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(FONTS_CHANGED_EVENT, onChanged)
  }, [refresh])

  return { fonts, loading, refresh }
}

/**
 * Pilihan font untuk dropdown: bawaan sistem dulu, lalu font kustom.
 *
 * Font kustom diberi label bertanda supaya pengguna tahu font itu berasal
 * dari berkas miliknya sendiri dan akan hilang bila data situs dihapus.
 */
export function useFontOptions() {
  const { fonts } = useCustomFonts()

  const builtin = FONT_FAMILIES.map((f) => ({ value: f, label: f }))
  const custom = fonts.map((f) => ({ value: f.family, label: `${f.family} (kustom)` }))

  // Font kustom yang namanya bentrok dengan bawaan cukup ditampilkan sekali.
  const seen = new Set(builtin.map((o) => o.value))
  return [...builtin, ...custom.filter((o) => !seen.has(o.value))]
}
