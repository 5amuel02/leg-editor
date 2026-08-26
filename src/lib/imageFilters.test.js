import { describe, expect, it } from 'vitest'
import {
  ADJUSTMENTS,
  TOGGLE_FILTERS,
  applyAdjustments,
  hasAdjustments,
  neutralAdjustments,
  readAdjustments,
} from './imageFilters'

/** Gambar palsu secukupnya: pipeline filter hanya butuh dua hal ini. */
function gambarPalsu() {
  return {
    filters: [],
    diterapkan: 0,
    applyFilters() {
      this.diterapkan += 1
    },
  }
}

describe('neutralAdjustments', () => {
  it('mencakup semua penyesuaian dan toggle', () => {
    const n = neutralAdjustments()
    ADJUSTMENTS.forEach((a) => expect(n[a.id]).toBe(a.neutral))
    TOGGLE_FILTERS.forEach((t) => expect(n[t.id]).toBe(false))
  })
})

describe('hasAdjustments', () => {
  it('false untuk nilai netral', () => {
    expect(hasAdjustments(neutralAdjustments())).toBe(false)
    expect(hasAdjustments(null)).toBe(false)
  })

  it('true begitu satu slider bergeser', () => {
    expect(hasAdjustments({ ...neutralAdjustments(), brightness: 0.2 })).toBe(true)
  })

  it('true begitu satu toggle menyala', () => {
    expect(hasAdjustments({ ...neutralAdjustments(), grayscale: true })).toBe(true)
  })

  it('memperlakukan pixelate=1 sebagai netral, bukan 0', () => {
    expect(hasAdjustments({ ...neutralAdjustments(), pixelate: 1 })).toBe(false)
    expect(hasAdjustments({ ...neutralAdjustments(), pixelate: 4 })).toBe(true)
  })
})

describe('applyAdjustments', () => {
  it('tidak memasang filter apa pun untuk nilai netral', () => {
    const img = gambarPalsu()
    applyAdjustments(img, neutralAdjustments())
    expect(img.filters).toHaveLength(0)
    expect(img.diterapkan).toBe(1)
  })

  it('hanya memasang filter yang benar-benar berpengaruh', () => {
    const img = gambarPalsu()
    applyAdjustments(img, { ...neutralAdjustments(), brightness: 0.3, grayscale: true })
    expect(img.filters).toHaveLength(2)
  })

  it('menyusun ulang pipeline, bukan menumpuk', () => {
    const img = gambarPalsu()
    applyAdjustments(img, { ...neutralAdjustments(), brightness: 0.3 })
    applyAdjustments(img, { ...neutralAdjustments(), contrast: 0.2 })
    expect(img.filters).toHaveLength(1)
  })

  it('mengabaikan objek yang bukan gambar', () => {
    expect(() => applyAdjustments(null, neutralAdjustments())).not.toThrow()
    expect(() => applyAdjustments({}, neutralAdjustments())).not.toThrow()
  })
})

describe('readAdjustments', () => {
  it('bolak-balik dengan applyAdjustments tanpa kehilangan nilai', () => {
    const img = gambarPalsu()
    const nilai = { ...neutralAdjustments(), brightness: 0.25, contrast: -0.4, sepia: true }
    applyAdjustments(img, nilai)
    expect(readAdjustments(img)).toEqual(nilai)
  })

  it('mengembalikan nilai netral untuk gambar tanpa filter', () => {
    expect(readAdjustments({ filters: [] })).toEqual(neutralAdjustments())
    expect(readAdjustments(null)).toEqual(neutralAdjustments())
  })

  it('mengabaikan entri filter yang rusak', () => {
    expect(() => readAdjustments({ filters: [null, undefined, {}] })).not.toThrow()
  })
})
