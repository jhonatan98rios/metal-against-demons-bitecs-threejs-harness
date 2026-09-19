import * as THREE from 'three'

import { SCENARIOS } from '../core/scenarios/definitions'
import { createFillGrounds, createGround } from './level-1/world/createGround'
import { createRoad } from './level-1/world/createRoad'

export function createScenario(
  scene: THREE.Scene<THREE.Object3DEventMap>,
  scenarioId: SCENARIOS
): void {
  if (scenarioId == SCENARIOS.LEVEL1) {
    const [leftGround, rightGround] = createGround()
    scene.add(leftGround)
    scene.add(rightGround)
    // ponytail: flat sand fill behind the real floor hides the gray bg through noise gaps
    for (const fill of createFillGrounds()) {
      scene.add(fill)
    }
    scene.add(createRoad())
  }
}
