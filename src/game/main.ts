import * as THREE from 'three'

import { setupWorld } from './core/bootstrap/setup'
import { setupApparition } from './core/enemies/entity'
import { createEnemyPool } from './core/enemies/pool/enemyPool'
import { createBoidsSystem } from './core/enemies/systems/boidsSystem'
import { createEnemyDeathSystem } from './core/enemies/systems/deathSystem'
import { createPlayerDamageSystem } from './core/enemies/systems/playerDamageSystem'
import { createPlayerDeathSystem } from './core/player/deathSystem'
import { createCharacterController } from './gameplay/characterController'
import { createInput } from './gameplay/input'
import { createVirtualJoystick } from './gameplay/virtualJoystick'
import { createCameraTouchController } from './gameplay/cameraTouchController'
import { createWorkerPool } from './systems/createWorkerPool'
import { createRender } from './rendering/createRender'
import { createRenderSystem, renderObjects } from './rendering/createRenderSystem'
import { createCameraSystem } from './systems/cameraSystem'
import { createBillboardSystem } from './systems/billboardSystem'
import { createCameraSwitcher } from './ui/cameraSwitcher'
import { PlayerHUD } from './ui/PlayerHUD'
import { createProjectileSystems } from './core/projectiles/projectileSystems'
import { Health } from './core/shared/components/Health'
import { createScenario, SCENARIOS } from './scenarios/createScenario'

function spawnEnemies(pool: ReturnType<typeof createEnemyPool>) {
  Array.from({ length: 100 }, () => {
    const eid = pool.acquire()
    setupApparition(
      eid,
      5 + Math.random() * 50,
      -15 + Math.random() * 40,
      Math.random() > 0.5
    )
  })
}

export function start() {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement
  if (!canvas || typeof window === 'undefined') return

  const world = setupWorld()
  const { renderer, scene, camera } = createRender(canvas)
  const delta = { last: performance.now(), current: 0 }

  createScenario(scene, SCENARIOS.LEVEL1)
  const enemyPool = createEnemyPool(world, 100)
  spawnEnemies(enemyPool)

  const systems = createGameSystems(world, scene, camera, enemyPool)

  const hudContainer = document.querySelector('#hud-container')
  const hud = hudContainer ? new PlayerHUD(hudContainer as HTMLElement) : null

  const loop = () => {
    const now = performance.now()
    delta.current = Math.min(0.1, (now - delta.last) / 1000)
    delta.last = now

    systems.controller.update(delta.current)
    systems.boids.update()
    systems.projectiles.spawn.update()
    systems.animation.update(delta.current)
    systems.projectiles.collision.update()
    systems.playerDamage.update(delta.current)
    systems.death.update()
    systems.playerDeath.update()
    systems.projectiles.despawn.update(delta.current)
    systems.render(delta.current)
    systems.camera.update()
    systems.billboard.update()

    if (hud) {
      hud.update(Health.current[world.playerEid], Health.max[world.playerEid])
    }

    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}

function createGameSystems(
  world: ReturnType<typeof setupWorld>,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  enemyPool: ReturnType<typeof createEnemyPool>
) {
  const input = createInput()
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    createVirtualJoystick(input)

  const cameraTouch = createCameraTouchController()
  const cameraSystem = createCameraSystem(world, camera, () =>
    cameraTouch.getAngle()
  )
  const controller = createCharacterController(
    world,
    input,
    20,
    () => (cameraSystem.isFirstPerson() ? cameraTouch.getAngle() : 0)
  )

  createCameraSwitcher(() => cameraSystem.toggle())

  return {
    boids: createBoidsSystem(world),
    render: createRenderSystem(world, scene),
    animation: createWorkerPool(world),
    projectiles: createProjectileSystems(world),
    death: createEnemyDeathSystem(world, (eid) => enemyPool.release(eid)),
    playerDamage: createPlayerDamageSystem(world),
    playerDeath: createPlayerDeathSystem(world),
    camera: cameraSystem,
    controller,
    billboard: createBillboardSystem(world, camera, renderObjects)
  }
}
