import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MAX_ITEM_LEVEL,
  STORE_ITEMS,
  loadItemLevels,
  upgradeItem
} from './upgrades'

const makeStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value)
  }
}

describe('store upgrade levels', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: makeStorage() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('catalogs 12 items across 4 shelves of 3', () => {
    expect(STORE_ITEMS).toHaveLength(12)
    expect(new Set(STORE_ITEMS.map((item) => item.id)).size).toBe(12)
  })

  it('starts every item at level 0', () => {
    const levels = loadItemLevels()
    expect(Object.values(levels)).toEqual(STORE_ITEMS.map(() => 0))
  })

  it('caps an item at level 10 and persists progress', () => {
    const levels = Array.from({ length: 20 }, () => 'pick').reduce(
      upgradeItem,
      loadItemLevels()
    )
    expect(levels.pick).toBe(MAX_ITEM_LEVEL)
    expect(loadItemLevels().pick).toBe(MAX_ITEM_LEVEL)
  })

  it('ignores unknown ids and clamps stored values', () => {
    const levels = loadItemLevels()
    expect(upgradeItem(levels, 'not-an-item')).toEqual(levels)

    window.localStorage.setItem(
      'mad-store-upgrades',
      JSON.stringify({ pick: 99, strings: -3, ghost: 7 })
    )
    const loaded = loadItemLevels()
    expect(loaded.pick).toBe(MAX_ITEM_LEVEL)
    expect(loaded.strings).toBe(0)
    expect(loaded.ghost).toBeUndefined()
  })
})
