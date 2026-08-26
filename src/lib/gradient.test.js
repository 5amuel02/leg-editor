import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GRADIENT,
  gradientCoords,
  gradientPatch,
  isGradientFill,
  readGradient,
} from './gradient'

const bulat = (n) => Math.round(n * 1000) / 1000

describe('gradientCoords', () => {
  it('menghasilkan garis mendatar pada 0 derajat', () => {
    const c = gradientCoords(0)
    expect([bulat(c.x1), bulat(c.y1), bulat(c.x2), bulat(c.y2)]).toEqual([0, 0.5, 1, 0.5])
  })

  it('menghasilkan garis tegak pada 90 derajat', () => {
    const c = gradientCoords(90)
    expect([bulat(c.x1), bulat(c.y1), bulat(c.x2), bulat(c.y2)]).toEqual([0.5, 0, 0.5, 1])
  })

  it('selalu simetris terhadap pusat objek', () => {
    for (const sudut of [0, 37, 90, 180, 245, 359]) {
      const c = gradientCoords(sudut)
      expect(bulat((c.x1 + c.x2) / 2)).toBe(0.5)
      expect(bulat((c.y1 + c.y2) / 2)).toBe(0.5)
    }
  })
})

describe('isGradientFill', () => {
  it('membedakan gradien dari warna solid', () => {
    expect(isGradientFill({ colorStops: [] })).toBe(true)
    expect(isGradientFill('#ff0000')).toBe(false)
    expect(isGradientFill(null)).toBe(false)
    expect(isGradientFill({})).toBe(false)
  })
})

describe('readGradient', () => {
  it('menandai isian solid sebagai nonaktif', () => {
    expect(readGradient({ fill: '#ff0000' }).enabled).toBe(false)
    expect(readGradient(null).enabled).toBe(false)
  })

  it('membaca ulang gradien hasil gradientPatch', () => {
    const nilai = { from: '#e11620', to: '#f59e0b', angle: 90 }
    const { fill } = gradientPatch(nilai)
    expect(readGradient({ fill })).toEqual({ ...nilai, enabled: true })
  })

  it('menormalkan sudut negatif ke rentang 0..360', () => {
    const { fill } = gradientPatch({ ...DEFAULT_GRADIENT, angle: 270 })
    expect(readGradient({ fill }).angle).toBe(270)
  })

  it('mengurutkan colorStops sebelum membaca warna ujung', () => {
    const fill = {
      colorStops: [
        { offset: 1, color: '#0000ff' },
        { offset: 0, color: '#ff0000' },
      ],
      coords: { x1: 0, y1: 0.5, x2: 1, y2: 0.5 },
    }
    const hasil = readGradient({ fill })
    expect(hasil.from).toBe('#ff0000')
    expect(hasil.to).toBe('#0000ff')
  })
})

describe('gradientPatch', () => {
  it('memakai satuan persentase agar bebas ukuran objek', () => {
    const { fill } = gradientPatch(DEFAULT_GRADIENT)
    expect(fill.gradientUnits).toBe('percentage')
  })
})
