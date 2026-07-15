import { setupWorld } from './core/bootstrap/setup'
import { setupApparition } from './core/enemies/entity'
import { createEnemyPool } from './core/enemies/pool/enemyPool'
import { createBoidsSystem } from './core/enemies/systems/boidsSystem'
import { createEnemyDeathSystem } from './core/enemies/systems/deathSystem'
import { createCharacterController } from './gameplay/characterController'
import { createInput } from './gameplay/input'
import { createVirtualJoystick } from './gameplay/virtualJoystick'
import { createWorkerPool } from './systems/createWorkerPool'
import { createRender } from './rendering/createRender'
import { createRenderSystem, renderObjects } from './rendering/createRenderSystem'
import { createCameraSystem } from './systems/cameraSystem'
import { createBillboardSystem } from './systems/billboardSystem'
import { createCameraSwitcher } from './ui/cameraSwitcher'
import { createProjectileSystems } from './core/projectiles/projectileSystems'
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

  const boidsSystem = createBoidsSystem(world)
  const renderSystem = createRenderSystem(world, scene)
  const animationSystem = createWorkerPool(world)
  const input = createInput()

  if ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    createVirtualJoystick(input)

  const projectileSystems = createProjectileSystems(world)
  const deathSystem = createEnemyDeathSystem(world, (eid) =>
    enemyPool.release(eid)
  )
  const controller = createCharacterController(world, input)
  const cameraSystem = createCameraSystem(world, camera)
  const billboardSystem = createBillboardSystem(world, camera, renderObjects)
  createCameraSwitcher(() => cameraSystem.toggle())
  const loop = () => {
    const now = performance.now()
    delta.current = Math.min(0.1, (now - delta.last) / 1000)
    delta.last = now

    controller.update(delta.current)
    boidsSystem.update()
    projectileSystems.spawn.update()
    animationSystem.update(delta.current)
    projectileSystems.collision.update()
    deathSystem.update()
    projectileSystems.despawn.update(delta.current)
    renderSystem()
    cameraSystem.update()
    billboardSystem.update()
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}
