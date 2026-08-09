import { SCENARIOS } from '../scenarios/definitions'

export interface PhaseDef {
  id: string
  name: string
  description: string
  enemyCount: number
  poolSize: number
  scenario: SCENARIOS
}

export const PHASES: PhaseDef[] = [
  {
    id: 'phase-1',
    name: 'First Contact',
    description: '40 enemies — a gentle start',
    enemyCount: 40,
    poolSize: 60,
    scenario: SCENARIOS.LEVEL1
  },
  {
    id: 'phase-2',
    name: 'Rising Tide',
    description: '100 enemies — they are getting closer',
    enemyCount: 100,
    poolSize: 120,
    scenario: SCENARIOS.LEVEL1
  },
  {
    id: 'phase-3',
    name: 'Full Assault',
    description: '200 enemies — all hell breaks loose',
    enemyCount: 200,
    poolSize: 240,
    scenario: SCENARIOS.LEVEL1
  },
  {
    id: 'phase-4',
    name: 'The Swarm',
    description: '4000 enemies — the true horde arrives',
    enemyCount: 4000,
    poolSize: 4200,
    scenario: SCENARIOS.LEVEL1
  }
]

export function getPhase(id: string): PhaseDef | undefined {
  return PHASES.find((p) => p.id === id)
}

export const DEFAULT_PHASE = PHASES[0]
