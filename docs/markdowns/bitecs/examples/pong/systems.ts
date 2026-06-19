import { QueryResult } from 'bitecs'
import {
  Ball,
  Paddle,
  Position,
  Renderable,
  Score,
  Velocity
} from './components'
import { CollisionContext, RenderContext } from './types'

/**
 * Movement system.
 *
 * Integrates velocity into position.
 *
 * Same ECS concept used in your movementSystem example:
 * position += velocity * delta
 */
export function movementSystem(movementQuery: QueryResult, delta: number) {
  for (const eid of movementQuery) {
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
  }
}

/**
 * Clamp paddles inside screen.
 *
 * Systems are usually small and focused.
 */
export function paddleBoundsSystem(
  paddleQuery: QueryResult,
  canvas: HTMLCanvasElement
) {
  for (const eid of paddleQuery) {
    const height = Renderable.height[eid]

    if (Position.y[eid] < 0) {
      Position.y[eid] = 0
    }

    if (Position.y[eid] + height > canvas.height) {
      Position.y[eid] = canvas.height - height
    }
  }
}

/**
 * Reset ball helper.
 *
 * Keeps game flow simple.
 */
export function resetBall(
  eid: number,
  direction: number,
  canvas: HTMLCanvasElement
) {
  Position.x[eid] = canvas.width / 2
  Position.y[eid] = canvas.height / 2

  Velocity.x[eid] = 280 * direction

  Velocity.y[eid] = (Math.random() * 2 - 1) * 240
}

/**
 * Input system.
 *
 * Systems:
 * - read components
 * - mutate components
 * - contain gameplay logic
 *
 * This system only changes paddle velocity.
 */
export function inputSystem(
  leftPaddle: number,
  rightPaddle: number,
  keys: Record<string, boolean>
) {
  Velocity.y[leftPaddle] = 0
  Velocity.y[rightPaddle] = 0

  const leftSpeed = Paddle.speed[leftPaddle]
  const rightSpeed = Paddle.speed[rightPaddle]

  // WASD
  if (keys['w']) {
    Velocity.y[leftPaddle] = -leftSpeed
  }

  if (keys['s']) {
    Velocity.y[leftPaddle] = leftSpeed
  }

  // Arrow keys
  if (keys['ArrowUp']) {
    Velocity.y[rightPaddle] = -rightSpeed
  }

  if (keys['ArrowDown']) {
    Velocity.y[rightPaddle] = rightSpeed
  }
}

export function renderSystem(renderQuery: QueryResult, context: RenderContext) {
  renderBackground(context)
  renderCenterLine(context)
  renderEntities(context.ctx, renderQuery)
  renderScore(context)
}

function renderBackground({ ctx, canvas }: RenderContext) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function renderCenterLine({ ctx, canvas }: RenderContext) {
  ctx.fillStyle = '#333'

  Array.from(
    { length: Math.ceil(canvas.height / 30) },
    (_, index) => index * 30
  ).forEach((y) => {
    ctx.fillRect(canvas.width / 2 - 2, y, 4, 20)
  })
}

function renderEntities(
  ctx: CanvasRenderingContext2D,
  renderQuery: QueryResult
) {
  ctx.fillStyle = 'white'

  for (const eid of renderQuery) {
    ctx.fillRect(
      Position.x[eid],
      Position.y[eid],
      Renderable.width[eid],
      Renderable.height[eid]
    )
  }
}

function renderScore({ ctx, canvas, scoreEntity }: RenderContext) {
  ctx.font = '48px monospace'

  ctx.fillText(String(Score.left[scoreEntity]), canvas.width / 2 - 100, 60)

  ctx.fillText(String(Score.right[scoreEntity]), canvas.width / 2 + 60, 60)
}

export function ballCollisionSystem(
  ballQuery: QueryResult,
  context: CollisionContext
) {
  for (const eid of ballQuery) {
    handleWallCollision(eid, context.canvas)
    handlePaddleCollision(eid, context.leftPaddle, true)
    handlePaddleCollision(eid, context.rightPaddle, false)
    handleScoring(eid, context)
  }
}

function handleWallCollision(ballEid: number, canvas: HTMLCanvasElement) {
  const radius = Ball.radius[ballEid]

  if (Position.y[ballEid] <= 0) {
    Position.y[ballEid] = 0
    Velocity.y[ballEid] *= -1
  }

  if (Position.y[ballEid] + radius * 2 >= canvas.height) {
    Position.y[ballEid] = canvas.height - radius * 2
    Velocity.y[ballEid] *= -1
  }
}

function handlePaddleCollision(
  ballEid: number,
  paddleEid: number,
  isLeftPaddle: boolean
) {
  if (!intersectsPaddle(ballEid, paddleEid)) {
    return
  }

  const radius = Ball.radius[ballEid]

  if (isLeftPaddle) {
    Position.x[ballEid] = Position.x[paddleEid] + Renderable.width[paddleEid]

    Velocity.x[ballEid] = Math.abs(Velocity.x[ballEid])
  } else {
    Position.x[ballEid] = Position.x[paddleEid] - radius * 2

    Velocity.x[ballEid] = -Math.abs(Velocity.x[ballEid])
  }

  applyPaddleBounce(ballEid, paddleEid)
}

function applyPaddleBounce(ballEid: number, paddleEid: number) {
  const center = Position.y[paddleEid] + Renderable.height[paddleEid] / 2

  Velocity.y[ballEid] += (Position.y[ballEid] - center) * 2
}

function intersectsPaddle(ballEid: number, paddleEid: number) {
  const diameter = Ball.radius[ballEid] * 2

  return (
    Position.x[ballEid] < Position.x[paddleEid] + Renderable.width[paddleEid] &&
    Position.x[ballEid] + diameter > Position.x[paddleEid] &&
    Position.y[ballEid] <
      Position.y[paddleEid] + Renderable.height[paddleEid] &&
    Position.y[ballEid] + diameter > Position.y[paddleEid]
  )
}

function handleScoring(ballEid: number, context: CollisionContext) {
  if (Position.x[ballEid] < -50) {
    Score.right[context.scoreEntity] += 1
    resetBall(ballEid, 1, context.canvas)
    return
  }

  if (Position.x[ballEid] > context.canvas.width + 50) {
    Score.left[context.scoreEntity] += 1
    resetBall(ballEid, -1, context.canvas)
  }
}
