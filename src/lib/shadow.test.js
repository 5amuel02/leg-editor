import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHADOW,
  hexToRgba,
  readShadow,
  rgbaToHex,
  shadowPatch,
  supportsShadow,
} from './shadow'

describe('hexToRgba', () => {
  it('mengubah hex 6 digit menjadi rgba', () => {
    expect(hexToRgba('#1e293b', 0.35)).toBe('rgba(30, 41, 59, 0.35)')
  })

  it('memuaikan hex 3 digit', () => {
    expect(hexToRgba('#abc', 1)).toBe('rgba(170, 187, 204, 1)')
  })

  it('jatuh ke hitam untuk masukan yang tidak valid', () => {
    expect(hexToRgba('bukan-warna', 1)).toBe('rgba(0, 0, 0, 1)')
    expect(hexToRgba(undefined, 1)).toBe('rgba(0, 0, 0, 1)')
  })

  it('menjepit kepekatan ke rentang 0..1', () => {
    expect(hexToRgba('#000000', -5)).toBe('rgba(0, 0, 0, 0)')
    expect(hexToRgba('#000000', 9)).toBe('rgba(0, 0, 0, 1)')
  })
})

describe('rgbaToHex', () => {
  it('membalik hexToRgba tanpa kehilangan nilai', () => {
    const asal = { color: '#1e293b', opacity: 0.35 }
    expect(rgbaToHex(hexToRgba(asal.color, asal.opacity))).toEqual(asal)
  })

  it('memberi kepekatan 1 saat rgb tanpa alpha', () => {
    expect(rgbaToHex('rgb(255, 0, 0)')).toEqual({ color: '#ff0000', opacity: 1 })
  })

  it('meneruskan hex apa adanya', () => {
    expect(rgbaToHex('#ff8800')).toEqual({ color: '#ff8800', opacity: 1 })
  })

  it('memakai warna bawaan untuk masukan tak dikenal', () => {
    expect(rgbaToHex('kacau')).toEqual({ color: DEFAULT_SHADOW.color, opacity: 1 })
  })
})

describe('readShadow', () => {
  it('menandai objek tanpa bayangan sebagai nonaktif', () => {
    expect(readShadow({}).enabled).toBe(false)
    expect(readShadow(null).enabled).toBe(false)
  })

  it('membaca kembali bayangan yang ada', () => {
    const obj = { shadow: { color: 'rgba(15, 23, 42, 0.5)', blur: 12, offsetX: 4, offsetY: -2 } }
    expect(readShadow(obj)).toEqual({
      enabled: true,
      color: '#0f172a',
      opacity: 0.5,
      blur: 12,
      offsetX: 4,
      offsetY: -2,
    })
  })

  it('mengisi nilai bawaan untuk angka yang hilang', () => {
    const hasil = readShadow({ shadow: { color: '#000000' } })
    expect(hasil.blur).toBe(DEFAULT_SHADOW.blur)
    expect(hasil.offsetX).toBe(DEFAULT_SHADOW.offsetX)
  })
})

describe('shadowPatch', () => {
  it('melepas bayangan saat dinonaktifkan', () => {
    expect(shadowPatch({ enabled: false })).toEqual({ shadow: null })
    expect(shadowPatch(null)).toEqual({ shadow: null })
  })

  it('menghasilkan bayangan yang bisa dibaca ulang oleh readShadow', () => {
    const nilai = { enabled: true, color: '#112233', opacity: 0.4, blur: 20, offsetX: 3, offsetY: 7 }
    const { shadow } = shadowPatch(nilai)
    expect(readShadow({ shadow })).toEqual(nilai)
  })
})

describe('supportsShadow', () => {
  it('mengizinkan elemen non-teks', () => {
    expect(supportsShadow('shape')).toBe(true)
    expect(supportsShadow('image')).toBe(true)
    expect(supportsShadow('group')).toBe(true)
  })

  it('menolak teks — teks memakai preset efeknya sendiri', () => {
    expect(supportsShadow('text')).toBe(false)
  })
})
