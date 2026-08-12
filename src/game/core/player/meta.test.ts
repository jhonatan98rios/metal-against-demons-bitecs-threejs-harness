import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addExperience, addMoney, loadPlayerState, savePlayerState } from './meta'

const DEFAULTS = {
  level: 1,
  experience: 0,
  money: 0,
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
    state.attributes.health = 150
    savePlayerState(state)
    expect(loadPlayerState()).toEqual({
      level: 4,
      experience: 250,
      money: 120,
      attributes: {
        health: 150,
        baseDamage: 1,
        attackSpeed: 1,
        attackRange: 1,
        movementSpeed: 20,
        luck: 1
      }
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
