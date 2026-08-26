import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SHORTCUT_GROUPS, countShortcuts } from './shortcuts'

const semuaItem = SHORTCUT_GROUPS.flatMap((g) => g.items)

describe('bentuk katalog', () => {
  it('setiap grup punya id, label, dan isi', () => {
    SHORTCUT_GROUPS.forEach((g) => {
      expect(g.id).toBeTruthy()
      expect(g.label).toBeTruthy()
      expect(g.items.length).toBeGreaterThan(0)
    })
  })

  it('id grup tidak ada yang kembar', () => {
    const id = SHORTCUT_GROUPS.map((g) => g.id)
    expect(new Set(id).size).toBe(id.length)
  })

  it('setiap pintasan punya nama aksi dan minimal satu tombol', () => {
    semuaItem.forEach((item) => {
      expect(item.action).toBeTruthy()
      expect(Array.isArray(item.keys)).toBe(true)
      expect(item.keys.length).toBeGreaterThan(0)
      item.keys.forEach((k) => expect(typeof k).toBe('string'))
    })
  })

  it('nama aksi tidak ada yang kembar', () => {
    const aksi = semuaItem.map((i) => i.action)
    expect(new Set(aksi).size).toBe(aksi.length)
  })

  it('countShortcuts cocok dengan jumlah sebenarnya', () => {
    expect(countShortcuts()).toBe(semuaItem.length)
  })
})

/**
 * Panel Bantuan hanya berguna kalau isinya jujur. Test di bawah membaca
 * `useShortcuts.js` dan memastikan setiap tombol yang benar-benar ditangani
 * memang muncul di katalog — supaya menambah pintasan baru tanpa
 * mendokumentasikannya langsung ketahuan.
 */
describe('katalog sejalan dengan useShortcuts', () => {
  const sumber = fs.readFileSync('src/hooks/useShortcuts.js', 'utf8')
  const tombolTerdaftar = new Set(
    semuaItem.flatMap((i) => [...i.keys, ...(i.alt || [])]).map((k) => k.toLowerCase()),
  )

  const wajibAda = [
    ["e.key.toLowerCase() === 'z'", 'z'],
    ["e.key.toLowerCase() === 'y'", 'y'],
    ["e.key.toLowerCase() === 'c'", 'c'],
    ["e.key.toLowerCase() === 'd'", 'd'],
    ["e.key.toLowerCase() === 'g'", 'g'],
    ["e.key.toLowerCase() === 's'", 's'],
    ["e.key === 'Delete'", 'delete'],
    ["e.key === 'Backspace'", 'backspace'],
    ["e.key === '0'", '0'],
  ]

  wajibAda.forEach(([potongan, tombol]) => {
    it(`mendokumentasikan tombol "${tombol}"`, () => {
      // Prasyarat: pintasan itu memang masih ditangani hook-nya.
      expect(sumber).toContain(potongan)
      expect(tombolTerdaftar.has(tombol)).toBe(true)
    })
  })

  it('mendokumentasikan geser dengan tombol panah', () => {
    expect(sumber).toContain('ArrowLeft')
    expect(semuaItem.some((i) => /Geser/i.test(i.action))).toBe(true)
  })

  it('mendokumentasikan Escape', () => {
    expect(sumber).toContain("e.key === 'Escape'")
    expect(tombolTerdaftar.has('esc')).toBe(true)
  })
})
