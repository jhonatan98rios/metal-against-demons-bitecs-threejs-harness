import { query, World } from 'bitecs'
import { Velocity } from '../core/shared/components/Velocity'
import { Animation } from '../core/shared/components/Animation'

export const createAnimationSystem = (world: World) => {
  return (dt: number) => {
    const entities = query(world, [Animation, Velocity])

    for (const eid of entities) {
      // console.log(entities)
      // console.log(Animation.currentFrame[eid])

      // const moving =
      //   Math.abs(Velocity.x[eid]) > 0.01 ||
      //   Math.abs(Velocity.z[eid]) > 0.01

      // if (!moving) continue

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
