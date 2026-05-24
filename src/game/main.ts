import { setupWorld } from './core/bootstrap/setup'
import { createRender } from './rendering/createRender'
import { createScenario, SCENARIOS } from './scenarios/createScenario'

export const start = () => {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement

  if (!canvas || typeof window === 'undefined') return

  const world = setupWorld()
  const { renderer, scene, camera } = createRender(canvas)

  createScenario(scene, SCENARIOS.LEVEL1)

  console.log(scene)

  const loop = () => {
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }

  loop()

  console.log({
    world,
    scene,
    renderer
  })
}
