import { SCENARIOS } from '../scenarios/definitions'

export interface PhaseDef {
  id: string
  name: string
  description: string
  enemyCount: number
  poolSize: number
  /** Base seconds between enemy spawns — pools reference this value */
  spawnInterval: number
  scenario: SCENARIOS
}

export const PHASES: PhaseDef[] = [
  {
    id: 'phase-1',
    name: 'First Contact',
    description: '100 enemies — a gentle start',
    enemyCount: 100,
    poolSize: 110,
    spawnInterval: 0.8,
    scenario: SCENARIOS.LEVEL1
  },
  {
    id: 'phase-2',
    name: 'Rising Tide',
    description: '200 enemies — they are getting closer',
    enemyCount: 200,
    poolSize: 210,
    spawnInterval: 0.5,
    scenario: SCENARIOS.LEVEL1
  },
  {
    id: 'phase-3',
    name: 'Full Assault',
    description: '300 enemies — all hell breaks loose',
    enemyCount: 300,
    poolSize: 310,
    spawnInterval: 0.3,
    scenario: SCENARIOS.LEVEL1
  },
  {
    id: 'phase-4',
    name: 'The Swarm',
    description: '5000 enemies — the true horde arrives',
    enemyCount: 5000,
    poolSize: 5100,
    spawnInterval: 0.12,
    scenario: SCENARIOS.LEVEL1
  }
]

export function getPhase(id: string): PhaseDef | undefined {
  return PHASES.find((p) => p.id === id)
}

export const DEFAULT_PHASE = PHASES[0]
