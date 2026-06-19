/**
 * Shadow follow system.
 *
 * Moves the directional light and its shadow volume to track the player.
 * Light direction is fixed — only position recenters around the player.
 *
 * Root cause of previous bugs:
 *   The original system used cameraEid to position the light. Since the
 *   camera smoothly follows the player with delay, the light direction,
 *   shadow frustum, and target all shifted as the camera moved. This
 *   caused shadows to change direction, change length, and disappear.
 *
 * Fix:
 *   - Use playerEid instead of cameraEid
 *   - LIGHT_DIRECTION is a normalized constant — never changes
 *   - lightPosition = playerPosition + LIGHT_DIRECTION * LIGHT_DISTANCE
 *   - lightTarget = playerPosition
 *   - Shadow frustum stays centered on player
 */
import { World } from 'bitecs'
import * as THREE from 'three'

import { Position } from '../core/shared/components/Position'

export interface ShadowWorld extends World {
  playerEid: number
}

/**
 * Constant normalized light direction — never rotates during gameplay.
 *
 * Top-down horde-survival lighting:
 *   Light comes from behind the camera and above, shining forward/downward
 *   onto the scene. This ensures shadows cast away from the camera (forward
 *   into the scene) rather than toward the viewer.
 *   Components: slightly right (+0.2 X), above (+3.0 Y), in front (-0.5 Z).
 *
 * Note: The comment previously said "behind" — updated to reflect the flipped Z.
 */

const LIGHT_DIRECTION = new THREE.Vector3(0.2, 3.0, -0.5).normalize()

/** Distance from player to light in world units. */
const LIGHT_DISTANCE = 150

/** Half-size of the orthographic shadow frustum in world units. */
const SHADOW_SIZE = 200

export function createShadowFollowSystem(
  world: World,
  dirLight: THREE.DirectionalLight,
  scene: THREE.Scene
) {
  const sw = world as ShadowWorld
  /* Debug helpers (temporary) */
  const lightHelper = new THREE.DirectionalLightHelper(dirLight, 20)
  scene.add(lightHelper)
  const cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera)
  scene.add(cameraHelper)
  /* Light target must be in scene so matrices update */
  scene.add(dirLight.target)

  return () => {
    const peid = sw.playerEid
    if (typeof peid !== 'number') return
    /* Read player position from ECS */
    const px = Position.x[peid],
      py = Position.y[peid],
      pz = Position.z[peid]
    /* Compute light position: fixed offset in LIGHT_DIRECTION */
    const lx = px + LIGHT_DIRECTION.x * LIGHT_DISTANCE,
      ly = py + LIGHT_DIRECTION.y * LIGHT_DISTANCE,
      lz = pz + LIGHT_DIRECTION.z * LIGHT_DISTANCE
    /* Recenter target and light around the player */
    dirLight.target.position.set(px, py, pz)
    dirLight.position.set(lx, ly, lz)
    /* Move shadow frustum to cover the area around the player */
    const shadowCam = dirLight.shadow.camera
    shadowCam.left = -SHADOW_SIZE
    shadowCam.right = SHADOW_SIZE
    shadowCam.top = SHADOW_SIZE
    shadowCam.bottom = -SHADOW_SIZE
    shadowCam.updateProjectionMatrix()
    lightHelper.update()
    cameraHelper.update()
  }
}
