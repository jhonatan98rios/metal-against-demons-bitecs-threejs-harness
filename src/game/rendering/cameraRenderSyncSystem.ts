/**
 * Camera render sync system.
 *
 * Reads the ECS camera entity Position and synchronises the
 * Three.js PerspectiveCamera to match. Also looks at the
 * player entity Position so the camera faces the player.
 *
 * Rendering layer — touches Three.js objects.
 */
import { World } from 'bitecs'
import * as THREE from 'three'

import { Position } from '../core/shared/components/Position'

export interface CameraWorld extends World {
  playerEid?: number
  cameraEid?: number
}

export function createCameraRenderSyncSystem(
  world: World,
  threeCamera: THREE.PerspectiveCamera
) {
  const cw = world as CameraWorld

  return () => {
    const ceid = cw.cameraEid
    const peid = cw.playerEid
    if (typeof ceid !== 'number' || typeof peid !== 'number') return

    threeCamera.position.set(
      Position.x[ceid],
      Position.y[ceid],
      Position.z[ceid]
    )

    threeCamera.lookAt(Position.x[peid], Position.y[peid], Position.z[peid])
  }
}
