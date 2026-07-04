import { setupWorld } from './core/bootstrap/setup'
import { setupApparition } from './core/enemies/entity'
import { createEnemyPool } from './core/enemies/pool/enemyPool'
import { createBoidsSystem } from './core/enemies/systems/boidsSystem'
import { createCharacterController } from './gameplay/characterController'
import { createInput } from './gameplay/input'
import { createVirtualJoystick } from './gameplay/virtualJoystick'
import { createWorkerPool } from './systems/createWorkerPool'
import { createRender, createFollowCamera } from './rendering/createRender'
import { createRenderSystem } from './rendering/createRenderSystem'
import { createProjectileSystems } from './core/projectiles/projectileSystems'
import { createScenario, SCENARIOS } from './scenarios/createScenario'

export function start() {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement

  if (!canvas || typeof window === 'undefined') return

  const world = setupWorld()
  const { renderer, scene, camera } = createRender(canvas)

  const delta = { last: performance.now(), current: 0 }

  createScenario(scene, SCENARIOS.LEVEL1)

  const enemyPool = createEnemyPool(world, 100)

  Array.from({ length: 100 }, () => {
    const eid = enemyPool.acquire()
    const x = 5 + Math.random() * 50
    const z = -15 + Math.random() * 40
    setupApparition(eid, x, z, Math.random() > 0.5)
  })

  const boidsSystem = createBoidsSystem(world)
  const renderSystem = createRenderSystem(world, scene)
  const animationSystem = createWorkerPool(world)
  const input = createInput()

  if ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    createVirtualJoystick(input)

  const projectileSystems = createProjectileSystems(world)
  const controller = createCharacterController(world, input)
  const updateCamera = createFollowCamera(camera, () => world.playerEid)
  const loop = () => {
    const now = performance.now()
    delta.current = Math.min(0.1, (now - delta.last) / 1000)
    delta.last = now

    controller.update(delta.current)
    boidsSystem.update()
    projectileSystems.spawn.update()
    animationSystem.update(delta.current)
    projectileSystems.collision.update()
    projectileSystems.despawn.update(delta.current)
    renderSystem()
    updateCamera()
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}
