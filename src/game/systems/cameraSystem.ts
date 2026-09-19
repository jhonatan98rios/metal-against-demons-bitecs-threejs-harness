import { query, World } from 'bitecs'
import * as THREE from 'three'
import { CameraLook } from '../core/shared/components/CameraLook'
import { CameraMode } from '../core/shared/components/CameraMode'
import { Position } from '../core/shared/components/Position'

type CameraWorld = World & {
  playerEid?: number
  cameraEid?: number
}

type Look = {
  yaw: number
  pitch: number
}

// ponytail: raised & pushed back — ~28% higher, ~20% farther, shows more road
const TOPDOWN_OFFSET = new THREE.Vector3(0, 28, 65)
const TOPDOWN_LOOK_AHEAD_Z = 20 // look this far ahead of player instead of at feet
const FP_EYE_Y = 3
const FP_LOOK_AHEAD = 20
// ponytail: ~83° of vertical range — enough for FPS, never flips over
const FP_PITCH_LIMIT = Math.PI / 2 - 0.15

const clampPitch = (pitch: number): number =>
  Math.max(-FP_PITCH_LIMIT, Math.min(FP_PITCH_LIMIT, pitch))

const getMode = (world: World) => {
  const modes = query(world, [CameraMode])
  return modes.length > 0 ? CameraMode.mode[modes[0]] : 0
}

// ponytail: look state lives in ECS — always consumes so deltas never pile up
const integrateLook = (
  world: CameraWorld,
  delta: Look,
  enabled: boolean
): Look => {
  const eid = world.cameraEid
  if (eid === undefined) return { yaw: 0, pitch: 0 }

  const yaw = CameraLook.yaw[eid] + (enabled ? delta.yaw : 0)
  const pitch = clampPitch(CameraLook.pitch[eid] + (enabled ? delta.pitch : 0))
  CameraLook.yaw[eid] = yaw
  CameraLook.pitch[eid] = pitch
  return { yaw, pitch }
}

const updateFirstPerson = (
  playerEid: number,
  camera: THREE.PerspectiveCamera,
  targetPos: THREE.Vector3,
  look: Look
) => {
  const cosPitch = Math.cos(look.pitch)
  targetPos.set(
    Position.x[playerEid],
    Position.y[playerEid] + FP_EYE_Y,
    Position.z[playerEid]
  )
  camera.position.copy(targetPos)
  camera.lookAt(
    targetPos.x + Math.sin(look.yaw) * cosPitch * FP_LOOK_AHEAD,
    targetPos.y + Math.sin(look.pitch) * FP_LOOK_AHEAD,
    targetPos.z - Math.cos(look.yaw) * cosPitch * FP_LOOK_AHEAD
  )
}

const updateTopDown = (
  playerEid: number,
  camera: THREE.PerspectiveCamera,
  targetPos: THREE.Vector3
) => {
  targetPos
    .set(Position.x[playerEid], Position.y[playerEid], Position.z[playerEid])
    .add(TOPDOWN_OFFSET)
  camera.position.copy(targetPos)
  // ponytail: look ahead of player — shows more road, less sand
  camera.lookAt(
    Position.x[playerEid],
    Position.y[playerEid],
    Position.z[playerEid] + TOPDOWN_LOOK_AHEAD_Z
  )
}

export const createCameraSystem = (
  world: CameraWorld,
  camera: THREE.PerspectiveCamera,
  consumeLook: () => Look = () => ({ yaw: 0, pitch: 0 })
) => {
  const targetPos = new THREE.Vector3()
  return {
    update() {
      const isFirstPerson = getMode(world) === 1
      const look = integrateLook(world, consumeLook(), isFirstPerson)
      const playerEid = world.playerEid
      if (!playerEid) return
      if (isFirstPerson) updateFirstPerson(playerEid, camera, targetPos, look)
      else updateTopDown(playerEid, camera, targetPos)
    },
    toggle() {
      const modes = query(world, [CameraMode])
      if (modes.length > 0)
        CameraMode.mode[modes[0]] = CameraMode.mode[modes[0]] === 0 ? 1 : 0
    },
    isFirstPerson: () => getMode(world) === 1,
    getYaw: () => {
      const eid = world.cameraEid
      return eid === undefined ? 0 : CameraLook.yaw[eid]
    }
  }
}
