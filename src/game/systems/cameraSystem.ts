import { query, World } from 'bitecs'
import * as THREE from 'three'
import { CameraMode } from '../core/shared/components/CameraMode'
import { Position } from '../core/shared/components/Position'

type CameraWorld = World & {
  playerEid?: number
}

const TOPDOWN_OFFSET = new THREE.Vector3(0, 20, 50)
const FP_EYE_Y = 3
const FP_NORTH = new THREE.Vector3(0, 0, -1)
const FP_LOOK_AHEAD = 20

const updateFirstPerson = (
  playerEid: number,
  camera: THREE.PerspectiveCamera,
  targetPos: THREE.Vector3
) => {
  targetPos.set(Position.x[playerEid], Position.y[playerEid] + FP_EYE_Y, Position.z[playerEid])
  camera.position.copy(targetPos)
  camera.lookAt(
    Position.x[playerEid] + FP_NORTH.x * FP_LOOK_AHEAD,
    Position.y[playerEid] + FP_EYE_Y * 0.5,
    Position.z[playerEid] + FP_NORTH.z * FP_LOOK_AHEAD
  )
}

const updateTopDown = (
  playerEid: number,
  camera: THREE.PerspectiveCamera,
  targetPos: THREE.Vector3
) => {
  targetPos.set(Position.x[playerEid], Position.y[playerEid], Position.z[playerEid]).add(TOPDOWN_OFFSET)
  camera.position.lerp(targetPos, 0.05)
  camera.lookAt(Position.x[playerEid], Position.y[playerEid], Position.z[playerEid])
}

const getMode = (world: World) => {
  const modes = query(world, [CameraMode])
  return modes.length > 0 ? CameraMode.mode[modes[0]] : 0
}

export const createCameraSystem = (
  world: CameraWorld,
  camera: THREE.PerspectiveCamera
) => {
  const targetPos = new THREE.Vector3()
  return {
    update() {
      const playerEid = world.playerEid
      if (!playerEid) return
      if (getMode(world) === 1)
        updateFirstPerson(playerEid, camera, targetPos)
      else
        updateTopDown(playerEid, camera, targetPos)
    },
    toggle() {
      const modes = query(world, [CameraMode])
      if (modes.length > 0)
        CameraMode.mode[modes[0]] = CameraMode.mode[modes[0]] === 0 ? 1 : 0
    }
  }
}
