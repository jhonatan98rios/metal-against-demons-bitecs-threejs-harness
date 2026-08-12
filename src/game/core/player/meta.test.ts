import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addExperience,
  addMoney,
  grantRunXp,
  loadPlayerState,
  runTotalXp,
  savePlayerState,
  upgradeAttribute
} from './meta'

const DEFAULTS = {
  level: 1,
  experience: 0,
  money: 0,
  upgradePoints: 0,
  attributes: {
    health: 100,
    baseDamage: 1,
    attackSpeed: 1,
    attackRange: 1,
    movementSpeed: 20,
    luck: 1
  }
}

const makeStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value)
  }
}

describe('player meta-progression state', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: makeStorage() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with defaults when nothing is saved', () => {
    expect(loadPlayerState()).toEqual(DEFAULTS)
  })

  it('persists state across loads', () => {
    const state = loadPlayerState()
    state.level = 4
    state.experience = 250
    state.money = 120
    state.upgradePoints = 3
    state.attributes.health = 150
    savePlayerState(state)
    expect(loadPlayerState()).toEqual({
      ...DEFAULTS,
      level: 4,
      experience: 250,
      money: 120,
      upgradePoints: 3,
      attributes: { ...DEFAULTS.attributes, health: 150 }
    })
  })

  it('recovers defaults from corrupt data and fills missing fields', () => {
    window.localStorage.setItem('mad-player', '{not json')
    expect(loadPlayerState()).toEqual(DEFAULTS)
    window.localStorage.setItem('mad-player', '{"money": 42}')
    expect(loadPlayerState()).toEqual({ ...DEFAULTS, money: 42 })
  })

  it('addExperience and addMoney mutate and persist', () => {
    const state = loadPlayerState()
    addExperience(state, 50)
    addMoney(state, 30)
    addMoney(state, -1000)
    expect(state.experience).toBe(50)
    expect(state.money).toBe(30)
    expect(loadPlayerState()).toEqual({ ...DEFAULTS, experience: 50, money: 30 })
  })
})

describe('level ups and run rewards', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: makeStorage() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('addExperience levels up at 10x thresholds and grants a point each', () => {
    const state = loadPlayerState()
    addExperience(state, 1200)
    expect(state.level).toBe(2)
    expect(state.experience).toBe(200)
    expect(state.upgradePoints).toBe(1)
    expect(loadPlayerState().level).toBe(2)
  })

  it('addExperience handles multi-level-ups from big rewards', () => {
    const state = loadPlayerState()
    addExperience(state, 10000)
    expect(state.level).toBe(5)
    expect(state.experience).toBe(1875)
    expect(state.upgradePoints).toBe(4)
  })

  it('runTotalXp sums run thresholds plus current progress', () => {
    expect(runTotalXp(1, 0)).toBe(0)
    expect(runTotalXp(2, 50)).toBe(150)
    expect(runTotalXp(4, 100)).toBe(575)
  })

  it('grantRunXp rewards a finished run', () => {
    grantRunXp(2, 50)
    expect(loadPlayerState()).toEqual({ ...DEFAULTS, experience: 150 })
  })
})

describe('upgradeAttribute', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: makeStorage() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('spends a point and persists', () => {
    const state = loadPlayerState()
    state.upgradePoints = 2
    upgradeAttribute(state, 'health')
    expect(state.upgradePoints).toBe(1)
    expect(state.attributes.health).toBe(101)
    expect(loadPlayerState().attributes.health).toBe(101)
  })

  it('does nothing without points', () => {
    const state = loadPlayerState()
    upgradeAttribute(state, 'luck')
    expect(state.upgradePoints).toBe(0)
    expect(state.attributes.luck).toBe(1)
    expect(loadPlayerState().attributes.luck).toBe(1)
  })
})
