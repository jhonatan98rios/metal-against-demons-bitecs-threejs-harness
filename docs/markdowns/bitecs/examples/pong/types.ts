export type CollisionContext = {
  canvas: HTMLCanvasElement
  leftPaddle: number
  rightPaddle: number
  scoreEntity: number
}

export type RenderContext = {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  scoreEntity: number
}
