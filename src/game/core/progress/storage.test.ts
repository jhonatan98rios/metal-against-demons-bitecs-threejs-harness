import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { completePhase, getHighestCompletedIndex, isUnlocked } from './storage'

function makeStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    }
  }
}

describe('phase progress storage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: makeStorage() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with only the first phase unlocked', () => {
    expect(isUnlocked(0)).toBe(true)
    expect(isUnlocked(1)).toBe(false)
  })

  it('unlocks exactly the next phase after completing one', () => {
    completePhase(0)
    expect(isUnlocked(0)).toBe(true)
    expect(isUnlocked(1)).toBe(true)
    expect(isUnlocked(2)).toBe(false)
  })

  it('replaying a completed phase never unlocks further phases', () => {
    completePhase(0)
    completePhase(0)
    expect(getHighestCompletedIndex()).toBe(0)
    expect(isUnlocked(2)).toBe(false)
  })

  it('persists the highest completed index', () => {
    completePhase(2)
    expect(getHighestCompletedIndex()).toBe(2)
    expect(isUnlocked(3)).toBe(true)
  })
})
