import { setupWorld } from './core/bootstrap/setup'
import { setupApparition } from './core/enemies/entity'
import { createEnemyPool } from './core/enemies/pool/enemyPool'
import { createBoidsSystem } from './core/enemies/systems/boidsSystem'
import { createCharacterController } from './gameplay/characterController'
import { createInput } from './gameplay/input'
import { createWorkerPool } from './systems/createWorkerPool'
import { createRender } from './rendering/createRender'
import { createRenderSystem } from './rendering/createRenderSystem'
import { createScenario, SCENARIOS } from './scenarios/createScenario'
import { createCameraFollowSystem } from './core/camera/systems/cameraFollowSystem'
import { createCameraRenderSyncSystem } from './rendering/cameraRenderSyncSystem'
import { createShadowFollowSystem } from './rendering/shadowFollowSystem'

export function start() {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement
  if (!canvas || typeof window === 'undefined') return
  const world = setupWorld()
  const { renderer, scene, camera, dirLight } = createRender(canvas)
  const delta = { last: performance.now(), current: 0 }

  createScenario(scene, SCENARIOS.LEVEL1)
  const enemyPool = createEnemyPool(world, 1500)
  Array.from({ length: 1500 }, () => {
    const eid = enemyPool.acquire()
    const x = 5 + Math.random() * 50
    const z = -15 + Math.random() * 40
    setupApparition(eid, x, z, Math.random() > 0.5)
  })
  const boidsSystem = createBoidsSystem(world)
  const renderSystem = createRenderSystem(world, scene)
  const animationSystem = createWorkerPool(world)
  const input = createInput()
  const controller = createCharacterController(world, input)
  const cameraFollowSystem = createCameraFollowSystem(world)
  const cameraRenderSyncSystem = createCameraRenderSyncSystem(world, camera)
  const shadowFollowSystem = createShadowFollowSystem(world, dirLight, scene)
  const loop = () => {
    const now = performance.now()
    delta.current = Math.min(0.1, (now - delta.last) / 1000)
    delta.last = now
    controller.update(delta.current)
    boidsSystem.update()
    animationSystem.update(delta.current)
    cameraFollowSystem.update(delta.current)
    cameraRenderSyncSystem()
    shadowFollowSystem()
    renderSystem()
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
  console.log({ world, scene })
}
