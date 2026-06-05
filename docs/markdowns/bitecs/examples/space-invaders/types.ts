import { World } from 'bitecs'

export type InputContext = {
  world: World
  delta: number
  keys: Record<string, boolean>
}

export type RenderContext = {
  world: World
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
}

export type CollisionContext = {
  world: World
  scoreEid: number
}
