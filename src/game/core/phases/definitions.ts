export interface PhaseDef {
  id: string
  name: string
  description: string
  enemyCount: number
  poolSize: number
}

export const PHASES: PhaseDef[] = [
  {
    id: 'phase-1',
    name: 'First Contact',
    description: '20 enemies — a gentle start',
    enemyCount: 20,
    poolSize: 30
  },
  {
    id: 'phase-2',
    name: 'Rising Tide',
    description: '50 enemies — they are getting closer',
    enemyCount: 50,
    poolSize: 60
  },
  {
    id: 'phase-3',
    name: 'Full Assault',
    description: '100 enemies — all hell breaks loose',
    enemyCount: 100,
    poolSize: 120
  }
]

export function getPhase(id: string): PhaseDef | undefined {
  return PHASES.find((p) => p.id === id)
}

export const DEFAULT_PHASE = PHASES[0]
