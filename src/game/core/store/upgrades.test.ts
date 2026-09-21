import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APPARITION } from '../enemies/definitions/apparition'
import { CRAWLER } from '../enemies/definitions/crawler'
import { PHASES } from '../phases/definitions'
import { runCoins } from '../player/meta'
import {
  MAX_ITEM_LEVEL,
  STORE_ITEMS,
  UPGRADE_BASE_COST,
  loadItemLevels,
  upgradeCost,
  upgradeItem
} from './upgrades'

const makeStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value)
  }
}

const stubStorage = () =>
  vi.stubGlobal('window', { localStorage: makeStorage() })

describe('store upgrade levels', () => {
  beforeEach(stubStorage)

  afterEach(() => vi.unstubAllGlobals())

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

describe('upgrade pricing', () => {
  it('follows a 1.5x curve from the base cost', () => {
    expect(upgradeCost(0)).toBe(UPGRADE_BASE_COST)
    expect(upgradeCost(1)).toBe(45)
    expect(upgradeCost(2)).toBe(68)
    expect(upgradeCost(9)).toBeGreaterThan(upgradeCost(8))
  })

  // Economy target: clearing phase 1 funds exactly 2 upgrades, no more.
  it('lets a phase-1 clear buy exactly 2 upgrades', () => {
    const avgKillXp = (APPARITION.XP_VALUE + CRAWLER.XP_VALUE) / 2
    const coins = runCoins(PHASES[0].enemyCount * avgKillXp)
    const two = upgradeCost(0) + upgradeCost(1)
    expect(coins).toBeGreaterThanOrEqual(two)
    expect(coins).toBeLessThan(two + upgradeCost(2))
  })
})
