import { setupWorld } from './core/bootstrap/setup'
import { createCharacterController } from './gameplay/characterController'
import { createInput } from './gameplay/input'
import { createAnimationSystem } from './rendering/createAnimationSystem'
import { createRender } from './rendering/createRender'
import { createRenderSystem } from './rendering/createRenderSystem'
import { createScenario, SCENARIOS } from './scenarios/createScenario'

export function start() {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement

  if (!canvas || typeof window === 'undefined') return

  const world = setupWorld()
  const { renderer, scene, camera } = createRender(canvas)

  const delta = {
    last: performance.now(),
    current: 0
  }

  createScenario(scene, SCENARIOS.LEVEL1)

  const renderSystem = createRenderSystem(world, scene)
  const animationSystem = createAnimationSystem(world)

  // Input & controller
  const input = createInput()
  const controller = createCharacterController(world, input)

  const loop = () => {
    const now = performance.now()
    delta.current = Math.min(0.1, (now - delta.last) / 1000)
    delta.last = now

    controller.update(delta.current)
    animationSystem(delta.current)
    renderSystem()

    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }

  loop()

  console.log({ world, scene })
}
