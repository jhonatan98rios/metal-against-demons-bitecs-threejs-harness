import { setupWorld } from './core/bootstrap/setup'
import { setupApparition } from './core/enemies/entity'
import { createEnemyPool } from './core/enemies/pool/enemyPool'
import { createCharacterController } from './gameplay/characterController'
import { createInput } from './gameplay/input'
import { createWorkerPool } from './systems/createWorkerPool'
import { createRender } from './rendering/createRender'
import { createRenderSystem } from './rendering/createRenderSystem'
import { createScenario, SCENARIOS } from './scenarios/createScenario'

export function start() {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement

  if (!canvas || typeof window === 'undefined') return

  const world = setupWorld()
  const { renderer, scene, camera } = createRender(canvas)

  const delta = { last: performance.now(), current: 0 }

  createScenario(scene, SCENARIOS.LEVEL1)
  const enemyPool = createEnemyPool(world, 1500)

  Array.from({ length: 1000 }, () => {
    const eid = enemyPool.acquire()
    const x = 5 + Math.random() * 50
    const z = -15 + Math.random() * 40
    setupApparition(eid, x, z, Math.random() > 0.5)
  })

  const renderSystem = createRenderSystem(world, scene)
  const animationSystem = createWorkerPool(world)

  const input = createInput()
  const controller = createCharacterController(world, input)

  const loop = () => {
    const now = performance.now()
    delta.current = Math.min(0.1, (now - delta.last) / 1000)
    delta.last = now

    controller.update(delta.current)
    animationSystem.update(delta.current)
    renderSystem()
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
  console.log({ world, scene })
}
