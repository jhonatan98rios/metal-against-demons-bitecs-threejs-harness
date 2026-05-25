import * as THREE from 'three'
import { World } from 'bitecs'

import { Position } from '../core/shared/components/Position'
import { Velocity } from '../core/shared/components/Velocity'

type Axis = {
  x: number
  z: number
}

type ControllerInput = {
  getAxis: () => Axis
}

type AnimatedPlayerObject = THREE.Object3D & {
  updateAnimation?: (delta: number, velocity: THREE.Vector3) => void
}

type ControllerWorld = World & {
  playerEid?: number
  playerObject?: AnimatedPlayerObject
  playerFacingX?: number
  playerFacingZ?: number
}

const normalizeAxis = (axis: Axis): Axis => {
  const length = Math.hypot(axis.x, axis.z)

  if (length <= 1) {
    return axis
  }

  return {
    x: axis.x / length,
    z: axis.z / length
  }
}

const updateFacing = (world: ControllerWorld, axis: Axis) => {
  const hasMovement = Math.hypot(axis.x, axis.z) > 0.0001

  if (!hasMovement) {
    return
  }

  world.playerFacingX = axis.x
  world.playerFacingZ = axis.z
}

const movePlayer = (
  playerEid: number,
  axis: Axis,
  speed: number,
  delta: number
) => {
  Position.x[playerEid] += axis.x * speed * delta
  Position.z[playerEid] += axis.z * speed * delta

  Velocity.x[playerEid] = 0
  Velocity.z[playerEid] = 0
}

const updateAnimation = (
  playerObject: AnimatedPlayerObject | undefined,
  delta: number,
  velocity: THREE.Vector3
) => {
  if (!playerObject || typeof playerObject.updateAnimation !== 'function') {
    return
  }

  playerObject.updateAnimation(delta, velocity)
}

export function createCharacterController(
  world: World,
  input: ControllerInput,
  speed = 20
) {
  const controllerWorld = world as ControllerWorld

  return {
    update(delta: number) {
      const playerEid = controllerWorld.playerEid

      if (typeof playerEid !== 'number') {
        return new THREE.Vector3(0, 0, 0)
      }

      const axis = normalizeAxis(input.getAxis())

      updateFacing(controllerWorld, axis)

      movePlayer(playerEid, axis, speed, delta)

      const velocity = new THREE.Vector3(axis.x, 0, axis.z)

      updateAnimation(controllerWorld.playerObject, delta, velocity)

      return velocity
    }
  }
}
