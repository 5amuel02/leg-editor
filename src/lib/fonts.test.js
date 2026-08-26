import { describe, expect, it } from 'vitest'
import { ACCEPTED_FONT_EXT, familyFromFilename, isFontFile } from './fonts'

describe('familyFromFilename', () => {
  it('membuang ekstensi dan mengubah pemisah jadi spasi', () => {
    expect(familyFromFilename('Roboto-BoldItalic.ttf')).toBe('Roboto BoldItalic')
    expect(familyFromFilename('My_Cool Font.woff2')).toBe('My Cool Font')
  })

  it('membiarkan nama sederhana apa adanya', () => {
    expect(familyFromFilename('Inter.otf')).toBe('Inter')
  })

  it('membuang kutip dan koma yang akan merusak nilai CSS font-family', () => {
    expect(familyFromFilename('"weird",name.ttf')).toBe('weirdname')
  })

  it('memberi nama cadangan saat tidak ada yang tersisa', () => {
    expect(familyFromFilename('.ttf')).toBe('Font Kustom')
    expect(familyFromFilename('')).toBe('Font Kustom')
    expect(familyFromFilename(undefined)).toBe('Font Kustom')
  })
})

describe('isFontFile', () => {
  it('menerima semua format yang didaftarkan', () => {
    ACCEPTED_FONT_EXT.forEach((ext) => expect(isFontFile(`Font${ext}`)).toBe(true))
  })

  it('tidak peduli huruf besar-kecil', () => {
    expect(isFontFile('Font.TTF')).toBe(true)
  })

  it('menolak berkas lain', () => {
    expect(isFontFile('gambar.png')).toBe(false)
    expect(isFontFile('catatan.txt')).toBe(false)
    expect(isFontFile('')).toBe(false)
    expect(isFontFile(undefined)).toBe(false)
  })
})
