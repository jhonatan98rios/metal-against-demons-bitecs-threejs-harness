'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { start } from '@/src/game/main'

function GameCanvas() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameRef = useRef<ReturnType<typeof start> | null>(null)

  useEffect(() => {
    const phaseId = searchParams.get('phase') ?? undefined
    gameRef.current = start(phaseId)
  }, [router, searchParams])

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
