import { describe, expect, it } from 'vitest'
import {
  createEmptyPage,
  createProject,
  duplicatePage,
  normalizeImportedProject,
  renumberPages,
  uid,
} from './project'

describe('uid', () => {
  it('memakai prefiks yang diminta', () => {
    expect(uid('halaman')).toMatch(/^halaman_/)
  })

  it('tidak pernah menghasilkan nilai kembar', () => {
    const kumpulan = new Set(Array.from({ length: 500 }, () => uid('x')))
    expect(kumpulan.size).toBe(500)
  })
})

describe('createEmptyPage', () => {
  it('membuat halaman kosong yang bisa langsung dimuat Fabric', () => {
    const p = createEmptyPage('Halaman 1', '#ffffff')
    expect(p.json.objects).toEqual([])
    expect(p.hidden).toBe(false)
    expect(p.locked).toBe(false)
    expect(p.background).toBe('#ffffff')
  })
})

describe('createProject', () => {
  it('membulatkan ukuran ke piksel utuh', () => {
    const p = createProject({ width: 1080.6, height: 720.2 })
    expect(p.size.width).toBe(1081)
    expect(p.size.height).toBe(720)
  })

  it('selalu berisi tepat satu halaman', () => {
    expect(createProject({ width: 100, height: 100 }).pages).toHaveLength(1)
  })

  it('memakai nama yang diberikan bila ada', () => {
    expect(createProject({ width: 100, height: 100, name: 'Poster' }).name).toBe('Poster')
  })
})

describe('duplicatePage', () => {
  it('menyalin isi secara mendalam, bukan berbagi rujukan', () => {
    const asli = createEmptyPage('Halaman 1')
    asli.json.objects.push({ type: 'Rect' })
    const salinan = duplicatePage(asli, 0)

    salinan.json.objects.push({ type: 'Circle' })
    expect(asli.json.objects).toHaveLength(1)
    expect(salinan.json.objects).toHaveLength(2)
  })

  it('memberi id baru', () => {
    const asli = createEmptyPage('Halaman 1')
    expect(duplicatePage(asli, 0).id).not.toBe(asli.id)
  })
})

describe('renumberPages', () => {
  it('menomori ulang hanya nama bawaan', () => {
    const hasil = renumberPages([
      { name: 'Halaman 3' },
      { name: 'Sampul' },
      { name: 'Halaman 9' },
    ])
    expect(hasil.map((p) => p.name)).toEqual(['Halaman 1', 'Sampul', 'Halaman 3'])
  })
})

describe('normalizeImportedProject', () => {
  const minimal = {
    size: { width: 800, height: 600 },
    pages: [{ json: { objects: [] } }],
  }

  it('menolak berkas yang bukan project', () => {
    expect(() => normalizeImportedProject(null)).toThrow()
    expect(() => normalizeImportedProject({})).toThrow()
    expect(() => normalizeImportedProject({ size: {}, pages: [] })).toThrow()
  })

  it('mengisi field yang hilang dengan nilai aman', () => {
    const p = normalizeImportedProject(minimal)
    expect(p.name).toBe('Project Impor')
    expect(p.size).toEqual({ width: 800, height: 600, presetId: 'custom', label: 'Custom' })
    expect(p.pages[0].name).toBe('Halaman 1')
    expect(p.pages[0].hidden).toBe(false)
  })

  it('memberi id baru bila berkas tidak punya', () => {
    expect(normalizeImportedProject(minimal).id).toMatch(/^proj_/)
  })

  it('jatuh ke 1080 saat ukuran tidak berupa angka', () => {
    const p = normalizeImportedProject({ ...minimal, size: { width: 'x', height: null } })
    expect(p.size.width).toBe(1080)
    expect(p.size.height).toBe(1080)
  })

  it('memaksa hidden/locked menjadi boolean', () => {
    const p = normalizeImportedProject({
      ...minimal,
      pages: [{ json: {}, hidden: 'ya', locked: 1 }],
    })
    expect(p.pages[0].hidden).toBe(true)
    expect(p.pages[0].locked).toBe(true)
  })
})
