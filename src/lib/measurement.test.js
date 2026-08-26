import { describe, expect, it } from 'vitest'
import { measurementText } from './measurement'

/** Objek Fabric palsu: badge hanya butuh kotak batas dan sudut. */
const objek = ({ left = 0, top = 0, width = 100, height = 50, angle = 0 } = {}) => ({
  angle,
  getBoundingRect: () => ({ left, top, width, height }),
})

describe('measurementText', () => {
  it('menampilkan lebar x tinggi pada mode size', () => {
    expect(measurementText(objek({ width: 320, height: 180 }), 'size')).toBe('320 × 180')
  })

  it('menampilkan koordinat pada mode position', () => {
    expect(measurementText(objek({ left: 120, top: 64 }), 'position')).toBe('X 120   Y 64')
  })

  it('menampilkan sudut pada mode angle', () => {
    expect(measurementText(objek({ angle: 45 }), 'angle')).toBe('45°')
  })

  it('menormalkan sudut negatif dan lebih dari 360', () => {
    expect(measurementText(objek({ angle: -90 }), 'angle')).toBe('270°')
    expect(measurementText(objek({ angle: 450 }), 'angle')).toBe('90°')
  })

  it('membulatkan pecahan sub-piksel', () => {
    expect(measurementText(objek({ width: 319.6, height: 180.2 }), 'size')).toBe('320 × 180')
    // Math.round(-0.4) menghasilkan -0; tercetak sebagai '0', bukan '-0'.
    expect(measurementText(objek({ left: 11.4, top: -0.4 }), 'position')).toBe('X 11   Y 0')
  })

  it('mengembalikan null tanpa target', () => {
    expect(measurementText(null, 'size')).toBeNull()
  })
})
