import { query, World } from 'bitecs'

import { Active } from '../core/shared/components/Active'
import { Velocity } from '../core/shared/components/Velocity'
import { Animation } from '../core/shared/components/Animation'

export const createAnimationSystem = (world: World) => {
  return (dt: number) => {
    const entities = query(world, [Active, Animation, Velocity])

    for (const eid of entities) {
      if (Active.isActive[eid] === 0) {
        continue
      }

      Animation.elapsed[eid] += dt

      const frameDuration = 1 / Animation.fps[eid]

      if (Animation.elapsed[eid] >= frameDuration) {
        Animation.elapsed[eid] = 0

        Animation.currentFrame[eid]++

        if (Animation.currentFrame[eid] > Animation.endFrame[eid]) {
          Animation.currentFrame[eid] = Animation.startFrame[eid]
        }
      }
    }
  }
}
