import * as THREE from 'three'

import { createGround } from './level-1/world/createGround'
import { createRoad } from './level-1/world/createRoad'

export enum SCENARIOS {
  LEVEL1
}

export function createScenario(
  scene: THREE.Scene<THREE.Object3DEventMap>,
  scenario_id: SCENARIOS
): void {
  if (scenario_id == SCENARIOS.LEVEL1) {
    scene.add(createGround())
    scene.add(createRoad())
  }
}
