'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { start } from '@/src/game/main'

function GameCanvas() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const phaseId = searchParams.get('phase') ?? undefined
    start(phaseId)
    // ponytail: run once on mount — cleanup handled by Return to Menu button
  }, [])

  return (
    <div className="relative flex h-screen w-screen items-center justify-center">
      <canvas id="game-canvas" className="h-full w-full" />
      <div
        id="hud-container"
        className="pointer-events-none absolute inset-0 z-10"
      />
    </div>
  )
}

export default function Phase1() {
  return (
    <Suspense fallback={<div />}>
      <GameCanvas />
    </Suspense>
  )
}
