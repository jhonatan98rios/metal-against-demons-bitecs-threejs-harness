/**
 * Persistent player meta-progression.
 *
 * Roguelite core: dying makes the player stronger, so this state survives
 * runs (level, XP, money, attributes). Single repository module — all
 * persistence goes through here, swap localStorage for a backend later.
 */
const STORAGE_KEY = 'mad-player'

export type Attribute = 'strength' | 'vitality' | 'agility'

export interface PlayerState {
  level: number
  experience: number
  money: number
  attributes: Record<Attribute, number>
}

const createDefaultState = (): PlayerState => ({
  level: 1,
  experience: 0,
  money: 0,
  attributes: { strength: 1, vitality: 1, agility: 1 }
})

// ponytail: merge-with-defaults tolerates missing fields; strict schema later
const normalize = (raw: unknown): PlayerState => {
  if (typeof raw !== 'object' || raw === null) return createDefaultState()
  const partial = raw as Partial<PlayerState>
  const defaults = createDefaultState()
  return {
    ...defaults,
    ...partial,
    attributes: { ...defaults.attributes, ...partial.attributes }
  }
}

export function loadPlayerState(): PlayerState {
  if (typeof window === 'undefined') return createDefaultState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === null ? createDefaultState() : normalize(JSON.parse(raw))
  } catch {
    return createDefaultState()
  }
}

export function savePlayerState(state: PlayerState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function addExperience(state: PlayerState, amount: number): void {
  state.experience += amount
  savePlayerState(state)
}

export function addMoney(state: PlayerState, amount: number): void {
  state.money = Math.max(0, state.money + amount)
  savePlayerState(state)
}
