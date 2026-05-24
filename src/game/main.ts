import { setupWorld } from './bootstrap/setup'
import { createRender } from './rendering/createRender'

export const start = () => {
  const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement

  if (!canvas || typeof window === 'undefined') return

  const world = setupWorld()
  const { renderer, scene, camera } = createRender(canvas)

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
