import { describe, expect, it, vi } from 'vitest'
import {
  contrastingTextColor,
  findLabel,
  findOwner,
  isLabel,
  isLabelable,
  syncLabel,
  unlink,
  withLabels,
} from './shapeLabel'

/** Bentuk palsu: `syncLabel` hanya butuh ukuran, sudut, dan titik pusatnya. */
const bentuk = ({ id = 's1', w = 200, h = 100, angle = 0, cx = 100, cy = 50, ...rest } = {}) => ({
  id,
  angle,
  legType: 'shape',
  getScaledWidth: () => w,
  getScaledHeight: () => h,
  getCenterPoint: () => ({ x: cx, y: cy }),
  set: vi.fn(),
  ...rest,
})

/** Label palsu yang mencatat apa saja yang disetel padanya. */
function label(props = {}) {
  const state = { ...props }
  return {
    state,
    set: vi.fn((patch) => Object.assign(state, patch)),
    initDimensions: vi.fn(),
    setPositionByOrigin: vi.fn(),
    setCoords: vi.fn(),
  }
}

const kanvas = (objects) => ({ getObjects: () => objects })

describe('isLabelable', () => {
  it('mengizinkan bentuk dan balon chat', () => {
    expect(isLabelable({ legType: 'shape' })).toBe(true)
    expect(isLabelable({ legType: 'bubble' })).toBe(true)
  })

  it('menolak jenis lain dan nilai kosong', () => {
    expect(isLabelable({ legType: 'image' })).toBe(false)
    expect(isLabelable({ legType: 'text' })).toBe(false)
    expect(isLabelable(null)).toBe(false)
  })
})

describe('isLabel', () => {
  it('dikenali dari tautan ke bentuk pemiliknya', () => {
    expect(isLabel({ legLabelFor: 's1' })).toBe(true)
    expect(isLabel({})).toBe(false)
    expect(isLabel(null)).toBe(false)
  })
})

describe('syncLabel', () => {
  it('menyetel lebar 82% dari lebar bentuk', () => {
    const l = label()
    syncLabel(bentuk({ w: 200 }), l)
    expect(l.state.width).toBeCloseTo(164)
  })

  it('menjaga lebar minimum agar teks tidak tergencet habis', () => {
    const l = label()
    syncLabel(bentuk({ w: 4 }), l)
    expect(l.state.width).toBe(20)
  })

  it('mengikuti sudut bentuk', () => {
    const l = label()
    syncLabel(bentuk({ angle: 30 }), l)
    expect(l.state.angle).toBe(30)
  })

  it('mengembalikan skala ke 1 supaya teks tidak ikut gepeng', () => {
    const l = label({ scaleX: 2.5, scaleY: 0.4 })
    syncLabel(bentuk(), l)
    expect(l.state.scaleX).toBe(1)
    expect(l.state.scaleY).toBe(1)
  })

  it('memusatkan lewat titik pusat bentuk', () => {
    const l = label()
    syncLabel(bentuk({ cx: 320, cy: 180 }), l)
    expect(l.setPositionByOrigin).toHaveBeenCalledWith({ x: 320, y: 180 }, 'center', 'center')
  })

  it('aman saat salah satu sisi tidak ada', () => {
    expect(() => syncLabel(null, label())).not.toThrow()
    expect(() => syncLabel(bentuk(), null)).not.toThrow()
  })
})

describe('findLabel / findOwner', () => {
  const l = { id: 't1', legLabelFor: 's1' }
  const s = { id: 's1', legLabelId: 't1' }
  const c = kanvas([s, l])

  it('menemukan pasangannya dari kedua arah', () => {
    expect(findLabel(c, s)).toBe(l)
    expect(findOwner(c, l)).toBe(s)
  })

  it('mengembalikan null untuk objek tanpa tautan', () => {
    expect(findLabel(c, { id: 'x' })).toBeNull()
    expect(findOwner(c, { id: 'x' })).toBeNull()
    expect(findLabel(null, s)).toBeNull()
  })
})

describe('withLabels', () => {
  it('menyertakan label saat bentuknya dihapus', () => {
    const l = { id: 't1', legLabelFor: 's1' }
    const s = { id: 's1', legLabelId: 't1' }
    expect(withLabels(kanvas([s, l]), [s])).toEqual([s, l])
  })

  it('melepas tautan saat justru labelnya yang dihapus', () => {
    const l = { id: 't1', legLabelFor: 's1' }
    const s = { id: 's1', legLabelId: 't1', set: vi.fn() }
    const hasil = withLabels(kanvas([s, l]), [l])
    expect(hasil).toEqual([l])
    expect(s.set).toHaveBeenCalledWith({ legLabelId: null })
  })

  it('tidak menggandakan objek yang sudah ada di daftar', () => {
    const l = { id: 't1', legLabelFor: 's1' }
    const s = { id: 's1', legLabelId: 't1', set: vi.fn() }
    expect(withLabels(kanvas([s, l]), [s, l])).toHaveLength(2)
  })

  it('melewati objek tanpa label', () => {
    const a = { id: 'a' }
    expect(withLabels(kanvas([a]), [a])).toEqual([a])
  })
})

describe('contrastingTextColor', () => {
  const gelap = '#0f172a'
  const terang = '#ffffff'

  it('memakai teks gelap di atas bentuk terang', () => {
    expect(contrastingTextColor('#ffffff')).toBe(gelap)
    expect(contrastingTextColor('#fef3c7')).toBe(gelap)
  })

  it('memakai teks terang di atas bentuk gelap', () => {
    expect(contrastingTextColor('#0f172a')).toBe(terang)
    expect(contrastingTextColor('#e11620')).toBe(terang)
  })

  it('menilai kuning sebagai warna terang, bukan gelap', () => {
    // Rata-rata RGB biasa menilai kuning gelap; pembobotan luminansi tidak.
    expect(contrastingTextColor('#ffff00')).toBe(gelap)
  })

  it('memahami hex 3 digit dan rgb()', () => {
    expect(contrastingTextColor('#fff')).toBe(gelap)
    expect(contrastingTextColor('#000')).toBe(terang)
    expect(contrastingTextColor('rgb(255, 255, 255)')).toBe(gelap)
    expect(contrastingTextColor('rgba(0, 0, 0, 0.5)')).toBe(terang)
  })

  it('jatuh ke putih untuk isian yang bukan warna solid', () => {
    expect(contrastingTextColor({ colorStops: [] })).toBe(terang)
    expect(contrastingTextColor(null)).toBe(terang)
    expect(contrastingTextColor('bukan-warna')).toBe(terang)
  })
})

describe('unlink', () => {
  it('mengosongkan legLabelId', () => {
    const s = { set: vi.fn() }
    unlink(s)
    expect(s.set).toHaveBeenCalledWith({ legLabelId: null })
  })

  it('aman untuk nilai kosong', () => {
    expect(() => unlink(null)).not.toThrow()
  })
})
