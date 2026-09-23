/**
 * Store shelf catalog and upgrade levels.
 *
 * 12 infernal music-shop items, 3 per shelf, each upgradable to level 10
 * (120 upgrade steps total). Levels persist across runs.
 *
 * Pricing is soulslike: the price depends on how many upgrades the player
 * already bought, not on which item. Buying the cheap item raises the price of
 * every other item, so the choice becomes "what is useful?" instead of "what is
 * cheap?" and builds stop converging on the cheapest stats.
 */
const STORAGE_KEY = 'mad-store-upgrades'

export const MAX_ITEM_LEVEL = 10
export const ITEMS_PER_SHELF = 3

/** Price of the first upgrade ever, in coins. */
export const UPGRADE_BASE_COST = 30

/** Coin weight of the curve — how fast prices climb per upgrade bought. */
export const UPGRADE_COST_SCALE = 25

export interface StoreItem {
  id: string
  name: string
  description: string
  /** What one level buys — shown in the upgrade modal. */
  effect: string
}

// ponytail: gameplay effects land here — an `effect(level)` pair is all the
// page needs once item bonuses are wired.
export const STORE_ITEMS: readonly StoreItem[] = [
  {
    id: 'pick',
    name: 'Palheta Endiabrada',
    description: 'Feita de chifre de demônio menor. Não desafina nem na lava.',
    effect: 'Aumenta o dano por golpe'
  },
  {
    id: 'strings',
    name: 'Cordas do Lamento',
    description: 'Afinam sozinhas com o choro dos condenados.',
    effect: 'Aumenta a precisão dos acordes'
  },
  {
    id: 'tuner',
    name: 'Afinador Elétrico do Grito das Almas',
    description: 'Baterias inclusas. Não inclusas: piedade.',
    effect: 'Reduz o tempo de recarga'
  },
  {
    id: 'distortion',
    name: 'Pedal de Distorção Possuído',
    description: 'Sussurra riffs que você não compôs.',
    effect: 'Aumenta o dano de distorção'
  },
  {
    id: 'sticks',
    name: 'Baqueta de Osso',
    description: 'Durabilidade eterna, procedência... discutível.',
    effect: 'Aumenta a velocidade de ataque'
  },
  {
    id: 'amp',
    name: 'Amplificador Valvulado do Abismo',
    description: 'O volume vai até 666.',
    effect: 'Aumenta o poder do ataque'
  },
  {
    id: 'headphones',
    name: 'Fone do Silêncio Eterno',
    description: 'Isola o som de fora e a sua alma de dentro.',
    effect: 'Aumenta a resistência a dano'
  },
  {
    id: 'guitar',
    name: 'Guitarra do Pacto Assinado',
    description: 'Assinada com sangue, garantia de 666 anos.',
    effect: 'Aumenta o dano base'
  },
  {
    id: 'cable',
    name: 'Cabo Blindado Contra Exorcismo',
    description: 'Nenhum padre consegue desligar o seu som.',
    effect: 'Aumenta o alcance do ataque'
  },
  {
    id: 'metronome',
    name: 'Metrônomo do Juízo Final',
    description: 'Marca o tempo até o fim dos tempos. Precisão absoluta.',
    effect: 'Aumenta a velocidade de movimento'
  },
  {
    id: 'strap',
    name: 'Correia de Alma Penada',
    description: 'Ajusta no ombro, aperta na consciência.',
    effect: 'Aumenta a esquiva'
  },
  {
    id: 'score',
    name: 'Partitura Escrita com Sangue',
    description: 'Toda música, inclusive as que ainda não existem.',
    effect: 'Melhora a habilidade especial'
  }
]

export type ItemLevels = Readonly<Record<string, number>>

/** Total upgrades bought across every item — the soulslike "level". */
export function totalUpgrades(levels: ItemLevels): number {
  return Object.values(levels).reduce((sum, level) => sum + level, 0)
}

/**
 * Cost of the next upgrade, given how many were already bought: 30, 55, 101,
 * 160, 239... Sub-exponential on purpose — 1.5^n would price the 120th
 * upgrade past 10^22 coins. Phase 1 pays 200 coins (200 kills), which buys 3.
 */
export function upgradeCost(bought: number): number {
  return Math.round(UPGRADE_BASE_COST + UPGRADE_COST_SCALE * bought ** 1.5)
}

const emptyLevels = (): ItemLevels =>
  Object.fromEntries(STORE_ITEMS.map((item) => [item.id, 0]))

const clampLevel = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(MAX_ITEM_LEVEL, Math.max(0, Math.trunc(value)))
    : 0

export function loadItemLevels(): ItemLevels {
  if (typeof window === 'undefined') return emptyLevels()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return emptyLevels()
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return emptyLevels()
    const stored = parsed as Record<string, unknown>
    return Object.fromEntries(
      STORE_ITEMS.map((item) => [item.id, clampLevel(stored[item.id])])
    )
  } catch {
    return emptyLevels()
  }
}

export function saveItemLevels(levels: ItemLevels): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(levels))
}

/** Returns the next level map (unknown and maxed items unchanged) and persists it. */
export function upgradeItem(levels: ItemLevels, id: string): ItemLevels {
  if (!STORE_ITEMS.some((item) => item.id === id)) return levels
  const current = clampLevel(levels[id])
  if (current >= MAX_ITEM_LEVEL) return levels
  const next = { ...levels, [id]: current + 1 }
  saveItemLevels(next)
  return next
}
