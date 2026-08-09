export enum SCENARIOS {
  LEVEL1
}

export interface ScenarioDef {
  name: string
  cover: string
}

export const SCENARIO_DEFS: Record<SCENARIOS, ScenarioDef> = {
  // ponytail: single desert scenario for now; add a new entry per scenario
  [SCENARIOS.LEVEL1]: { name: 'Desert', cover: '/world/sand.jpg' }
}
