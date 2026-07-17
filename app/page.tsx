import Link from 'next/link'
import { PHASES } from '@/src/game/core/phases/definitions'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900">
      <main className="flex w-full max-w-lg flex-col gap-6 px-6">
        <h1 className="text-center font-mono text-2xl font-bold text-zinc-100">
          Metal Against Demons
        </h1>
        <p className="text-center font-mono text-sm text-zinc-400">
          Select a phase
        </p>
        <div className="flex flex-col gap-3">
          {PHASES.map((phase) => (
            <div
              key={phase.id}
              className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-800 p-4"
            >
              <div>
                <div className="font-mono text-sm font-bold text-zinc-100">
                  {phase.name}
                </div>
                <div className="font-mono text-xs text-zinc-400">
                  {phase.description}
                </div>
              </div>
              <Link
                href={`/scenes/phase-1?phase=${phase.id}`}
                className="rounded bg-zinc-600 px-4 py-2 font-mono text-sm text-zinc-100 transition-colors hover:bg-zinc-500"
              >
                Select
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
