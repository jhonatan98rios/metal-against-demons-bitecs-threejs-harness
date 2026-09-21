/**
 * Store shelf catalog and upgrade levels.
 *
 * 12 infernal music-shop items, 3 per shelf, each upgradable to level 10
 * (120 upgrade steps total). Levels persist across runs.
 */
const STORAGE_KEY = 'mad-store-upgrades'

export const MAX_ITEM_LEVEL = 10
export const ITEMS_PER_SHELF = 3

export interface StoreItem {
  id: string
  name: string
  description: string
}

// ponytail: costs/effects land here — a `cost(level)` + `effect(level)` pair
// is all the page needs once money and gameplay bonuses are wired.
export const STORE_ITEMS: readonly StoreItem[] = [
  {
    id: 'pick',
    name: 'Palheta Endiabrada',
    description: 'Feita de chifre de demônio menor. Não desafina nem na lava.'
  },
  {
    id: 'strings',
    name: 'Cordas do Lamento',
    description: 'Afinam sozinhas com o choro dos condenados.'
  },
  {
    id: 'tuner',
    name: 'Afinador Elétrico do Grito das Almas',
    description: 'Baterias inclusas. Não inclusas: piedade.'
  },
  {
    id: 'distortion',
    name: 'Pedal de Distorção Possuído',
    description: 'Sussurra riffs que você não compôs.'
  },
  {
    id: 'sticks',
    name: 'Baqueta de Osso',
    description: 'Durabilidade eterna, procedência... discutível.'
  },
  {
    id: 'amp',
    name: 'Amplificador Valvulado do Abismo',
    description: 'O volume vai até 666.'
  },
  {
    id: 'headphones',
    name: 'Fone do Silêncio Eterno',
    description: 'Isola o som de fora e a sua alma de dentro.'
  },
  {
    id: 'guitar',
    name: 'Guitarra do Pacto Assinado',
    description: 'Assinada com sangue, garantia de 666 anos.'
  },
  {
    id: 'cable',
    name: 'Cabo Blindado Contra Exorcismo',
    description: 'Nenhum padre consegue desligar o seu som.'
  },
  {
    id: 'metronome',
    name: 'Metrônomo do Juízo Final',
    description: 'Marca o tempo até o fim dos tempos. Precisão absoluta.'
  },
  {
    id: 'strap',
    name: 'Correia de Alma Penada',
    description: 'Ajusta no ombro, aperta na consciência.'
  },
  {
    id: 'score',
    name: 'Partitura Escrita com Sangue',
    description: 'Toda música, inclusive as que ainda não existem.'
  }
]

export type ItemLevels = Readonly<Record<string, number>>

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

/** Returns the next level map (maxed items unchanged) and persists it. */
export function upgradeItem(levels: ItemLevels, id: string): ItemLevels {
  const current = clampLevel(levels[id])
  if (current >= MAX_ITEM_LEVEL) return levels
  const next = { ...levels, [id]: current + 1 }
  saveItemLevels(next)
  return next
}
