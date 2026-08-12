'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  loadPlayerState,
  upgradeAttribute,
  xpToNextLevel,
  type Attribute,
  type PlayerState
} from '@/src/game/core/player/meta'

const ATTRIBUTES: { key: Attribute; label: string; description: string }[] = [
  { key: 'health', label: 'Health', description: 'Max hit points' },
  { key: 'baseDamage', label: 'Base Damage', description: 'Damage per hit' },
  {
    key: 'attackSpeed',
    label: 'Attack Speed',
    description: 'Attacks per second'
  },
  { key: 'attackRange', label: 'Attack Range', description: 'Attack reach' },
  {
    key: 'movementSpeed',
    label: 'Movement Speed',
    description: 'Movement velocity'
  },
  {
    key: 'luck',
    label: 'Luck',
    description: 'Item drop chance — future feature'
  }
]

function AttributeCard({
  attr,
  value,
  canUpgrade,
  onUpgrade
}: {
  attr: (typeof ATTRIBUTES)[number]
  value: number
  canUpgrade: boolean
  onUpgrade: () => void
}) {
  return (
    <div className="rounded border border-zinc-700 bg-zinc-800 p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm font-bold text-zinc-100">
          {attr.label}
        </div>
        <div className="flex items-center gap-2">
          <div className="font-mono text-sm text-amber-400">{value}</div>
          <button
            type="button"
            onClick={onUpgrade}
            disabled={!canUpgrade}
            aria-label={`Upgrade ${attr.label}`}
            className="rounded border border-zinc-600 bg-zinc-700 px-2 font-mono text-sm text-zinc-100 transition-colors hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
      <div className="mt-1 font-mono text-xs text-zinc-400">
        {attr.description}
      </div>
    </div>
  )
}

export default function PlayerPage() {
  // ponytail: read on mount — navigation is a full page nav
  const [player, setPlayer] = useState<PlayerState | null>(null)

  useEffect(() => {
    setPlayer(loadPlayerState())
  }, [])

  if (!player) return null

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-900">
      <header className="flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-mono text-sm text-zinc-100 transition-colors hover:border-zinc-500"
        >
          ‹ Back
        </Link>
        <h1 className="font-mono text-lg font-bold text-zinc-100">
          Player Attributes
        </h1>
        <div className="w-16" />
      </header>
      <AttributesView player={player} setPlayer={setPlayer} />
    </div>
  )
}

function AttributesView({
  player,
  setPlayer
}: {
  player: PlayerState
  setPlayer: (player: PlayerState) => void
}) {
  const upgrade = (key: Attribute) => {
    upgradeAttribute(player, key)
    // ponytail: spread clones to force re-render of mutated state
    setPlayer({ ...player })
  }

  return (
    <main className="w-full max-w-3xl px-6 pb-8">
      <div className="mb-4 flex items-center justify-between font-mono text-sm text-zinc-400">
        <span>
          Level {player.level} — {player.experience}/{xpToNextLevel(player.level)} XP
        </span>
        <span className="text-amber-400">
          Upgrade points: {player.upgradePoints}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ATTRIBUTES.map((attr) => (
          <AttributeCard
            key={attr.key}
            attr={attr}
            value={player.attributes[attr.key]}
            canUpgrade={player.upgradePoints > 0}
            onUpgrade={() => upgrade(attr.key)}
          />
        ))}
      </div>
    </main>
  )
}
