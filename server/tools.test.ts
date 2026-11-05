import { describe, expect, it } from 'vitest'
import { getCurrentTime } from './tools'

describe('getCurrentTime', () => {
  it('returns a localized date and time', () => {
    expect(getCurrentTime()).toMatch(/\d{2}:\d{2}/)
  })
})
