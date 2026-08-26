import { describe, expect, it } from 'vitest'
import { ROTATE_SNAP_THRESHOLD, isSnapSuppressed, snapAngle } from './snapping'

describe('isSnapSuppressed', () => {
  it('mati saat Ctrl atau Cmd ditahan', () => {
    expect(isSnapSuppressed({ ctrlKey: true })).toBe(true)
    expect(isSnapSuppressed({ metaKey: true })).toBe(true)
  })

  it('menyala saat tidak ada modifier', () => {
    expect(isSnapSuppressed({})).toBe(false)
    expect(isSnapSuppressed({ shiftKey: true })).toBe(false)
  })

  it('aman terhadap event yang tidak ada', () => {
    expect(isSnapSuppressed(null)).toBe(false)
    expect(isSnapSuppressed(undefined)).toBe(false)
  })
})

describe('snapAngle', () => {
  it('menarik sudut yang sudah dekat ke kelipatan 45', () => {
    expect(snapAngle(2)).toBe(0)
    expect(snapAngle(43)).toBe(45)
    expect(snapAngle(92)).toBe(90)
    expect(snapAngle(268)).toBe(270)
  })

  it('melepas sudut yang masih jauh', () => {
    expect(snapAngle(20)).toBeNull()
    expect(snapAngle(60)).toBeNull()
  })

  it('menghormati ambang batas persis di tepinya', () => {
    expect(snapAngle(ROTATE_SNAP_THRESHOLD)).toBe(0)
    expect(snapAngle(ROTATE_SNAP_THRESHOLD + 1)).toBeNull()
  })

  it('menormalkan sudut negatif dan lebih dari 360', () => {
    expect(snapAngle(-2)).toBe(0)
    expect(snapAngle(362)).toBe(0)
    expect(snapAngle(-92)).toBe(270)
  })

  it('mengembalikan 0, bukan 360, di ujung lingkaran', () => {
    expect(snapAngle(358)).toBe(0)
  })
})
