'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  loadPlayerState,
  spendMoney,
  type PlayerState
} from '@/src/game/core/player/meta'
import {
  loadItemLevels,
  MAX_ITEM_LEVEL,
  upgradeItem,
  totalUpgrades,
  upgradeCost,
  type ItemLevels,
  type StoreItem
} from '@/src/game/core/store/upgrades'
import { UpgradeModal } from './UpgradeModal'

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
  // Same logic as the old inline upgrade button — spend first, then level up.
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
      {selected && (
        <UpgradeModal
          item={selected}
          level={levels[selected.id] ?? 0}
          cost={cost}
          maxed={(levels[selected.id] ?? 0) >= MAX_ITEM_LEVEL}
          onConfirm={() => upgrade(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
