import { addComponent, addEntity, createWorld, World } from 'bitecs'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'

import { CameraLook } from '../core/shared/components/CameraLook'
import { CameraMode } from '../core/shared/components/CameraMode'
import { Position } from '../core/shared/components/Position'
import { createCameraSystem } from './cameraSystem'

type TestWorld = World & { playerEid: number; cameraEid: number }
type Look = { yaw: number; pitch: number }

const buildSystem = (mode: number, looks: Look[]) => {
  const world = createWorld() as TestWorld
  const playerEid = addEntity(world)
  const cameraEid = addEntity(world)
  addComponent(world, cameraEid, CameraMode)
  addComponent(world, cameraEid, CameraLook)
  CameraMode.mode[cameraEid] = mode
  CameraLook.yaw[cameraEid] = 0
  CameraLook.pitch[cameraEid] = 0
  Position.x[playerEid] = 0
  Position.y[playerEid] = 0
  Position.z[playerEid] = 0
  world.playerEid = playerEid
  world.cameraEid = cameraEid

  const camera = new THREE.PerspectiveCamera()
  const queue = [...looks]
  const system = createCameraSystem(
    world,
    camera,
    () => queue.shift() ?? { yaw: 0, pitch: 0 }
  )
  return { cameraEid, camera, system }
}

const direction = (camera: THREE.PerspectiveCamera) => {
  const dir = new THREE.Vector3()
  camera.getWorldDirection(dir)
  return dir
}

describe('cameraSystem first-person look', () => {
  it('aims straight ahead when pitch is zero', () => {
    const { camera, system } = buildSystem(1, [{ yaw: 0, pitch: 0 }])
    system.update()
    expect(camera.position.y).toBeCloseTo(3)
    expect(direction(camera).y).toBeCloseTo(0)
    expect(direction(camera).z).toBeCloseTo(-1)
  })

  it('aims up for positive pitch and down for negative pitch', () => {
    const up = buildSystem(1, [{ yaw: 0, pitch: 0.5 }])
    up.system.update()
    expect(direction(up.camera).y).toBeGreaterThan(0)

    const down = buildSystem(1, [{ yaw: 0, pitch: -0.5 }])
    down.system.update()
    expect(direction(down.camera).y).toBeLessThan(0)
  })

  it('clamps pitch so the camera never flips over', () => {
    const { cameraEid, camera, system } = buildSystem(1, [
      { yaw: 0, pitch: 99 }
    ])
    system.update()
    expect(CameraLook.pitch[cameraEid]).toBeLessThan(Math.PI / 2)
    expect(direction(camera).y).toBeGreaterThan(0)
  })

  it('ignores pitch and stays top-down in mode 0', () => {
    const { camera, system } = buildSystem(0, [{ yaw: 0, pitch: 99 }])
    system.update()
    expect(camera.position.y).toBeCloseTo(28)
    expect(direction(camera).y).toBeLessThan(0)
  })
})
