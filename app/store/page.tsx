'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  loadPlayerState,
  spendMoney,
  type PlayerState
} from '@/src/game/core/player/meta'
import {
  ITEMS_PER_SHELF,
  MAX_ITEM_LEVEL,
  STORE_ITEMS,
  loadItemLevels,
  totalUpgrades,
  upgradeCost,
  upgradeItem,
  type ItemLevels,
  type StoreItem
} from '@/src/game/core/store/upgrades'
import { UpgradeModal } from './UpgradeModal'

// 3 items must fit side by side, and 4 shelves must fit the viewport height —
// min() picks whichever budget is tighter, so nothing overflows on mobile.
const ITEM_SIZE = 'w-[min(25%,calc((100dvh-260px)/4.8))]'

const SHELVES: readonly StoreItem[][] = Array.from(
  { length: STORE_ITEMS.length / ITEMS_PER_SHELF },
  (_, index) =>
    STORE_ITEMS.slice(index * ITEMS_PER_SHELF, (index + 1) * ITEMS_PER_SHELF)
)

function ItemArt({ level, maxed }: { level: number; maxed: boolean }) {
  const border = maxed
    ? 'border-amber-400 bg-amber-950/60'
    : 'border-zinc-600 hover:border-zinc-400'
  const badge = maxed ? 'text-amber-300' : 'text-zinc-300'
  return (
    // ponytail: square art placeholder — swap for item art when drawn
    <span
      className={`relative aspect-square w-full rounded border bg-zinc-800 shadow-[0_4px_10px_rgba(0,0,0,0.6)] transition-colors ${border}`}
    >
      <span
        className={`absolute inset-x-0 bottom-0 rounded-b bg-black/70 text-center font-mono text-[9px] leading-4 ${badge}`}
      >
        {level}/{MAX_ITEM_LEVEL}
      </span>
    </span>
  )
}

function ItemSlot({
  item,
  level,
  onSelect
}: {
  item: StoreItem
  level: number
  onSelect: () => void
}) {
  const maxed = level >= MAX_ITEM_LEVEL
  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${item.name} — ${item.description}`}
      aria-label={`${item.name}, level ${level} of ${MAX_ITEM_LEVEL}`}
      className={`${ITEM_SIZE} flex touch-manipulation flex-col items-center gap-1 select-none active:scale-95`}
    >
      <ItemArt level={level} maxed={maxed} />
      <span className="line-clamp-3 h-[33px] w-full text-center font-mono text-[9px] leading-[11px] text-zinc-300">
        {item.name}
      </span>
    </button>
  )
}

function Shelf({
  items,
  levels,
  onSelect
}: {
  items: readonly StoreItem[]
  levels: ItemLevels
  onSelect: (item: StoreItem) => void
}) {
  return (
    <div className="flex flex-col justify-end">
      <div className="flex items-end justify-around gap-2">
        {items.map((item) => (
          <ItemSlot
            key={item.id}
            item={item}
            level={levels[item.id] ?? 0}
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
      <div className="h-2 rounded-[2px] bg-gradient-to-b from-amber-700 via-amber-900 to-black shadow-[0_8px_16px_rgba(0,0,0,0.8)]" />
    </div>
  )
}

function StoreBody({
  levels,
  coins,
  onSelect
}: {
  levels: ItemLevels
  coins: number
  onSelect: (item: StoreItem) => void
}) {
  return (
    <>
      <header className="text-center">
        <h1 className="font-mono text-xl font-bold text-amber-400">
          Loja do Lamento
        </h1>
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          onde o seu lamento é a nossa alegria
        </p>
        <p className="mt-2 font-mono text-sm text-amber-300">🪙 {coins}</p>
      </header>
      <div className="flex flex-col gap-2">
        {SHELVES.map((shelf, index) => (
          <Shelf
            key={index}
            items={shelf}
            levels={levels}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  )
}

function StoreModal({
  selected,
  levels,
  player,
  cost,
  onBuy,
  onClose
}: {
  selected: StoreItem | null
  levels: ItemLevels
  player: PlayerState
  cost: number
  onBuy: (id: string) => void
  onClose: () => void
}) {
  if (selected === null) return null
  const level = levels[selected.id] ?? 0
  return (
    <UpgradeModal
      item={selected}
      level={level}
      cost={cost}
      maxed={level >= MAX_ITEM_LEVEL}
      affordable={player.money >= cost}
      onConfirm={() => {
        onBuy(selected.id)
        onClose()
      }}
      onClose={onClose}
    />
  )
}

export default function StorePage() {
  // ponytail: read on mount — navigation is a full page nav
  const [levels, setLevels] = useState<ItemLevels | null>(null)
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [selected, setSelected] = useState<StoreItem | null>(null)

  useEffect(() => {
    setLevels(loadItemLevels())
    setPlayer(loadPlayerState())
  }, [])

  if (levels === null || player === null)
    return <div className="min-h-[100dvh] bg-zinc-950" />

  // soulslike: one price for the whole store, driven by total upgrades bought.
  const cost = upgradeCost(totalUpgrades(levels))
  const upgrade = (id: string) => {
    if (!spendMoney(player, cost)) return
    setLevels(upgradeItem(levels, id))
    // ponytail: spread clone forces a re-render of the mutated player state
    setPlayer({ ...player })
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-zinc-950">
      {/* ponytail: hell music-shop backdrop art goes behind this content */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-10 rounded border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 font-mono text-sm text-zinc-100 backdrop-blur transition-colors hover:border-zinc-500"
      >
        ‹ Back
      </Link>
      <main className="mx-auto flex h-[100dvh] w-full max-w-md flex-col justify-center gap-6 px-8 py-6">
        <StoreBody
          levels={levels}
          coins={player.money}
          onSelect={setSelected}
        />
      </main>
      <StoreModal
        selected={selected}
        levels={levels}
        player={player}
        cost={cost}
        onBuy={upgrade}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
