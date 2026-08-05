/**
 * Tests for the damage popup text formatting.
 */
import { describe, expect, it } from 'vitest'

import { formatDamageText } from './createDamagePopup'

describe('formatDamageText', () => {
  it('prefixes the damage with a minus sign', () => {
    expect(formatDamageText(5)).toBe('-5')
  })

  it('rounds fractional damage', () => {
    expect(formatDamageText(3.4)).toBe('-3')
    expect(formatDamageText(3.6)).toBe('-4')
  })
})
