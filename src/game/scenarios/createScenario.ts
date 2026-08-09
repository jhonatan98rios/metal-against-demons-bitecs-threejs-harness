import * as THREE from 'three'

import { SCENARIOS } from '../core/scenarios/definitions'
import { createGround } from './level-1/world/createGround'
import { createRoad } from './level-1/world/createRoad'

export function createScenario(
  scene: THREE.Scene<THREE.Object3DEventMap>,
  scenarioId: SCENARIOS
): void {
  if (scenarioId == SCENARIOS.LEVEL1) {
    const [leftGround, rightGround] = createGround()
    scene.add(leftGround)
    scene.add(rightGround)
    scene.add(createRoad())
  }
}
