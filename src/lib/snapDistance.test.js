import { describe, expect, it } from 'vitest'
import { computeSnap } from './snapping'

/**
 * Objek Fabric palsu: `computeSnap` hanya butuh kotak batas, `setCoords`,
 * dan flag `visible`.
 */
function objek({ left, top, width, height }) {
  return {
    visible: true,
    setCoords() {},
    getBoundingRect: () => ({ left, top, width, height }),
  }
}

/** Kanvas palsu berisi sejumlah objek. */
const kanvas = (objects) => ({ getObjects: () => objects })

const SCENE = { sceneWidth: 1000, sceneHeight: 1000, zoom: 1 }

/** Menjalankan computeSnap untuk `target` di antara `lain`. */
function jalankan(target, lain = []) {
  return computeSnap({ canvas: kanvas([...lain, target]), target, ...SCENE })
}

describe('jarak antar elemen', () => {
  it('mengukur celah tegak saat dua elemen sejajar mendatar', () => {
    // Keduanya bertepi kiri 100. Yang digeser berada 60px di bawah acuan.
    const acuan = objek({ left: 100, top: 100, width: 200, height: 100 })
    const digeser = objek({ left: 100, top: 260, width: 200, height: 100 })

    const { distances } = jalankan(digeser, [acuan])
    const tegak = distances.filter((d) => d.axis === 'v')

    expect(tegak).toHaveLength(1)
    expect(tegak[0].value).toBe(60)
    expect(tegak[0].from).toBe(200) // sisi bawah acuan
    expect(tegak[0].to).toBe(260) // sisi atas elemen yang digeser
  })

  it('menaruh garis ukur di tengah bagian yang bertumpang tindih', () => {
    const acuan = objek({ left: 100, top: 100, width: 200, height: 100 })
    const digeser = objek({ left: 100, top: 260, width: 200, height: 100 })

    const { distances } = jalankan(digeser, [acuan])
    // Tumpang tindih mendatar 100..300 -> titik tengahnya 200.
    expect(distances.find((d) => d.axis === 'v').pos).toBe(200)
  })

  it('mengukur celah mendatar saat dua elemen sejajar tegak', () => {
    const acuan = objek({ left: 100, top: 100, width: 100, height: 200 })
    const digeser = objek({ left: 250, top: 100, width: 100, height: 200 })

    const { distances } = jalankan(digeser, [acuan])
    const mendatar = distances.filter((d) => d.axis === 'h')

    expect(mendatar.some((d) => d.value === 50)).toBe(true)
  })

  it('tidak memberi label saat kedua elemen saling tumpang tindih', () => {
    // Tepi kiri sama, tapi keduanya menempati rentang tegak yang sama.
    const acuan = objek({ left: 100, top: 100, width: 200, height: 200 })
    const digeser = objek({ left: 100, top: 150, width: 200, height: 200 })

    const { distances } = jalankan(digeser, [acuan])
    expect(distances.filter((d) => d.axis === 'v')).toHaveLength(0)
  })
})

describe('jarak ke kanvas', () => {
  it('menampilkan margin kiri dan kanan saat snap ke tengah kanvas', () => {
    // Lebar 200 di tengah kanvas 1000 -> margin 400 di kedua sisi.
    const digeser = objek({ left: 400, top: 300, width: 200, height: 100 })

    const { distances } = jalankan(digeser)
    const mendatar = distances.filter((d) => d.axis === 'h')

    expect(mendatar.map((d) => d.value).sort()).toEqual([400, 400])
  })

  it('melewatkan margin nol saat elemen menempel di tepi kanvas', () => {
    const digeser = objek({ left: 0, top: 300, width: 200, height: 100 })

    const { distances } = jalankan(digeser)
    const mendatar = distances.filter((d) => d.axis === 'h')

    // Margin kiri 0 dilewati; hanya sisa 800 di kanan yang diberi label.
    expect(mendatar.map((d) => d.value)).toEqual([800])
  })
})

describe('bentuk hasil', () => {
  it('selalu mengembalikan array distances, termasuk saat tidak ada snap', () => {
    expect(computeSnap({ canvas: null, target: null, ...SCENE }).distances).toEqual([])

    const jauh = objek({ left: 137, top: 411, width: 90, height: 70 })
    expect(Array.isArray(jalankan(jauh).distances)).toBe(true)
  })

  it('nilai jarak tidak pernah negatif', () => {
    const acuan = objek({ left: 100, top: 400, width: 200, height: 100 })
    const digeser = objek({ left: 100, top: 100, width: 200, height: 100 })

    const { distances } = jalankan(digeser, [acuan])
    distances.forEach((d) => expect(d.value).toBeGreaterThan(0))
  })
})
