'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { start } from '@/src/game/main'

export default function Phase1() {
  const router = useRouter()
  const gameRef = useRef<ReturnType<typeof start> | null>(null)

  useEffect(() => {
    gameRef.current = start()
  }, [router])

  return (
    <div className="relative flex h-screen w-screen items-center justify-center">
      <canvas id="game-canvas" className="h-full w-full" />
      <div id="hud-container" className="pointer-events-none absolute inset-0 z-10" />
    </div>
  )
}
