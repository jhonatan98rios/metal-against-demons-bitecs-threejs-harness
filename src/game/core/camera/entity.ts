/**
 * Camera entity factory.
 *
 * Creates a single persistent camera entity with Position and Velocity.
 * The camera entity ID is stored on `world.cameraEid` for access by
 * follow/render/shadow systems.
 */
import { addComponent, addEntity, World } from 'bitecs'

import { Active } from '../shared/components/Active'
import { Camera } from '../shared/components/Camera'
import { Position } from '../shared/components/Position'
import { Velocity } from '../shared/components/Velocity'

export interface CameraWorld extends World {
  cameraEid?: number
}

/**
 * Initial position matching the Three.js camera setup in createRender.
 * Player starts at (30, 5, 0); camera offset is (0, 20, 50).
 */
const CAMERA_INIT_X = 30
const CAMERA_INIT_Y = 25
const CAMERA_INIT_Z = 50

export function createCameraEntity(world: World): number {
  const eid = addEntity(world)

  addComponent(world, eid, Camera)
  addComponent(world, eid, Active)
  addComponent(world, eid, Position)
  addComponent(world, eid, Velocity)

  Camera.isCamera[eid] = 1
  Active.isActive[eid] = 1

  Position.x[eid] = CAMERA_INIT_X
  Position.y[eid] = CAMERA_INIT_Y
  Position.z[eid] = CAMERA_INIT_Z

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Velocity.x[eid] = 0
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Velocity.z[eid] = 0

  const cw = world as CameraWorld
  cw.cameraEid = eid

  return eid
}
