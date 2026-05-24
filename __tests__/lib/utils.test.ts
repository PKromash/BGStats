import { validateWindow } from '@/lib/utils'

describe('validateWindow', () => {
  it('returns season for undefined input', () => {
    expect(validateWindow(undefined)).toBe('season')
  })

  it('returns season for empty string', () => {
    expect(validateWindow('')).toBe('season')
  })

  it('accepts 7d', () => {
    expect(validateWindow('7d')).toBe('7d')
  })

  it('accepts 30d', () => {
    expect(validateWindow('30d')).toBe('30d')
  })

  it('accepts season', () => {
    expect(validateWindow('season')).toBe('season')
  })

  it('defaults invalid values to season', () => {
    expect(validateWindow('weekly')).toBe('season')
    expect(validateWindow('ALL')).toBe('season')
  })
})
