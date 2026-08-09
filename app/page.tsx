'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { PHASES, type PhaseDef } from '@/src/game/core/phases/definitions'
import { getHighestCompletedIndex } from '@/src/game/core/progress/storage'
import { SCENARIO_DEFS } from '@/src/game/core/scenarios/definitions'

function LevelCardContent({
  phase,
  unlocked
}: {
  phase: PhaseDef
  unlocked: boolean
}) {
  const scenario = SCENARIO_DEFS[phase.scenario]
  return (
    <>
      <div className="relative aspect-square w-full overflow-hidden">
        <img
          src={scenario.cover}
          alt={scenario.name}
          className={`h-full w-full object-cover transition-transform duration-300 ${
            unlocked ? 'group-hover:scale-105' : 'opacity-40 grayscale'
          }`}
        />
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-4xl">
            🔒
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <div className="font-mono text-sm font-bold text-zinc-100">
          {phase.name}
        </div>
        <div className="font-mono text-xs text-zinc-400">
          {phase.description}
        </div>
      </div>
    </>
  )
}

function LevelCard({
  phase,
  unlocked
}: {
  phase: PhaseDef
  unlocked: boolean
}) {
  const cardClass =
    'group w-64 shrink-0 snap-center overflow-hidden rounded border border-zinc-700 bg-zinc-800'
  if (!unlocked) {
    return (
      <div data-card className={cardClass}>
        <LevelCardContent phase={phase} unlocked={false} />
      </div>
    )
  }
  return (
    <Link
      data-card
      href={`/scenes/phase-1?phase=${phase.id}`}
      className={`${cardClass} transition-colors hover:border-zinc-500`}
    >
      <LevelCardContent phase={phase} unlocked />
    </Link>
  )
}

function LevelCarousel({ unlockedCount }: { unlockedCount: number }) {
  const trackRef = useRef<HTMLDivElement | null>(null)

  function scrollByCard(direction: -1 | 1) {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>('[data-card]')
    track.scrollBy({
      left: direction * (card?.offsetWidth ?? 256),
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-[calc(50%_-_8rem)] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PHASES.map((phase, index) => (
          <LevelCard
            key={phase.id}
            phase={phase}
            unlocked={index < unlockedCount}
          />
        ))}
      </div>
      <button
        type="button"
        aria-label="Previous levels"
        onClick={() => scrollByCard(-1)}
        className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700 px-3 py-2 font-mono text-lg text-zinc-100 transition-colors hover:bg-zinc-600"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next levels"
        onClick={() => scrollByCard(1)}
        className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700 px-3 py-2 font-mono text-lg text-zinc-100 transition-colors hover:bg-zinc-600"
      >
        ›
      </button>
    </div>
  )
}

function FixedNav() {
  return (
    <>
      <Link
        href="/config"
        aria-label="Settings"
        className="fixed top-4 right-4 z-10 rounded-full border border-zinc-700 bg-zinc-800 p-2.5 text-zinc-100 transition-colors hover:bg-zinc-700"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Link>
      <Link
        href="/store"
        aria-label="Store"
        className="fixed top-16 right-4 z-10 rounded-full border border-zinc-700 bg-zinc-800 p-2.5 text-zinc-100 transition-colors hover:bg-zinc-700"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
          />
        </svg>
      </Link>
    </>
  )
}

export default function Home() {
  // ponytail: progress read on mount — returning to menu is a full page nav
  const [highestCompleted, setHighestCompleted] = useState(-1)

  useEffect(() => {
    setHighestCompleted(getHighestCompletedIndex())
  }, [])

  const unlockedCount = Math.min(highestCompleted + 2, PHASES.length)
  const allCleared = highestCompleted === PHASES.length - 1

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900">
      <FixedNav />
      <main className="flex w-full max-w-3xl flex-col gap-6 px-6">
        <h1 className="text-center font-mono text-2xl font-bold text-zinc-100">
          Metal Against Demons
        </h1>
        <p className="text-center font-mono text-sm text-zinc-400">
          {allCleared
            ? 'All levels cleared'
            : `Current level: ${unlockedCount} of ${PHASES.length}`}
        </p>
        <LevelCarousel unlockedCount={unlockedCount} />
      </main>
    </div>
  )
}
