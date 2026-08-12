/**
 * Persistent player meta-progression.
 *
 * Roguelite core: dying makes the player stronger, so this state survives
 * runs (level, XP, money, attributes). Single repository module — all
 * persistence goes through here, swap localStorage for a backend later.
 */
const STORAGE_KEY = 'mad-player'

export type Attribute =
  | 'health'
  | 'baseDamage'
  | 'attackSpeed'
  | 'attackRange'
  | 'movementSpeed'
  | 'luck'

export interface PlayerState {
  level: number
  experience: number
  money: number
  upgradePoints: number
  attributes: Record<Attribute, number>
}

const createDefaultState = (): PlayerState => ({
  level: 1,
  experience: 0,
  money: 0,
  upgradePoints: 0,
  // ponytail: baselines mirror live game values (Health 100, speed 20, dmg 1)
  attributes: {
    health: 100,
    baseDamage: 1,
    attackSpeed: 1,
    attackRange: 1,
    movementSpeed: 20,
    luck: 1
  }
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

// Level curve: 100, 150, 225, ... — same 1.5x progression as in-run XP
export function xpToNextLevel(level: number): number {
  return Math.round(100 * 1.5 ** (level - 1))
}

export function upgradeAttribute(
  state: PlayerState,
  attribute: Attribute
): void {
  if (state.upgradePoints <= 0) return
  state.upgradePoints -= 1
  state.attributes[attribute] += 1
  savePlayerState(state)
}
