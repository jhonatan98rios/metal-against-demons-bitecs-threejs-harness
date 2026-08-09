'use client'

import Link from 'next/link'
import { useRef } from 'react'

import { PHASES, type PhaseDef } from '@/src/game/core/phases/definitions'
import { SCENARIO_DEFS } from '@/src/game/core/scenarios/definitions'

function LevelCard({ phase }: { phase: PhaseDef }) {
  const scenario = SCENARIO_DEFS[phase.scenario]
  return (
    <Link
      data-card
      href={`/scenes/phase-1?phase=${phase.id}`}
      className="group w-64 shrink-0 snap-center overflow-hidden rounded border border-zinc-700 bg-zinc-800 transition-colors hover:border-zinc-500"
    >
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={scenario.cover}
          alt={scenario.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1 p-4">
        <div className="font-mono text-sm font-bold text-zinc-100">
          {phase.name}
        </div>
        <div className="font-mono text-xs text-zinc-400">
          {phase.description}
        </div>
      </div>
    </Link>
  )
}

function LevelCarousel() {
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
        {PHASES.map((phase) => (
          <LevelCard key={phase.id} phase={phase} />
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900">
      <main className="flex w-full max-w-3xl flex-col gap-6 px-6">
        <h1 className="text-center font-mono text-2xl font-bold text-zinc-100">
          Metal Against Demons
        </h1>
        <p className="text-center font-mono text-sm text-zinc-400">
          Select a level
        </p>
        <LevelCarousel />
      </main>
    </div>
  )
}
