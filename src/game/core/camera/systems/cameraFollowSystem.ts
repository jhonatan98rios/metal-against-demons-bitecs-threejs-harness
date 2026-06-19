/**
 * Camera follow system.
 *
 * Reads player Position, computes desired camera position with
 * a fixed offset, and interpolates camera Position toward it.
 * Writes camera Velocity reflecting actual movement.
 *
 * Pure ECS — no Three.js dependencies.
 */
import { World } from 'bitecs'

import { Camera } from '../../shared/components/Camera'
import { Position } from '../../shared/components/Position'
import { Velocity } from '../../shared/components/Velocity'

export interface FollowWorld extends World {
  playerEid?: number
  cameraEid?: number
}

const OFFSET_X = 0
const OFFSET_Y = 20
const OFFSET_Z = 50
const SMOOTHING = 0.05

export function createCameraFollowSystem(world: World) {
  const fw = world as FollowWorld

  return {
    update(_dt: number) {
      const peid = fw.playerEid,
        ceid = fw.cameraEid
      if (typeof peid !== 'number' || typeof ceid !== 'number') return
      if (Camera.isCamera[ceid] === 0) return

      const px = Position.x[peid],
        pz = Position.z[peid],
        tx = px + OFFSET_X,
        tz = pz + OFFSET_Z,
        ty = OFFSET_Y,
        cx = Position.x[ceid],
        cy = Position.y[ceid],
        cz = Position.z[ceid],
        nx = cx + (tx - cx) * SMOOTHING,
        ny = cy + (ty - cy) * SMOOTHING,
        nz = cz + (tz - cz) * SMOOTHING,
        dt = Math.max(_dt, 0.001)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      Velocity.x[ceid] = (nx - cx) / dt
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      Velocity.z[ceid] = (nz - cz) / dt

      Position.x[ceid] = nx
      Position.y[ceid] = ny
      Position.z[ceid] = nz
    }
  }
}
