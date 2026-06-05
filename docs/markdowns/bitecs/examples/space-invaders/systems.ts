import { QueryResult, World } from 'bitecs'
import {
  Bullet,
  Enemy,
  Health,
  Player,
  Position,
  Renderable,
  Score,
  Velocity
} from './components'
import { createBullet } from './entities'
import { CollisionContext, InputContext, RenderContext } from './types'

/**
 * Movement system.
 *
 * Integrates velocity into position.
 *
 * Same ECS pattern:
 * position += velocity * delta
 */
export function movementSystem(
  world: World,
  delta: number,
  movementQuery: QueryResult
) {
  for (const eid of movementQuery) {
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
  }
}

/**
 * Bullet system.
 *
 * Bullets move based on direction.
 */
export function bulletSystem(
  world: World,
  delta: number,
  canvas: HTMLCanvasElement,
  bulletQuery: QueryResult
) {
  for (const eid of bulletQuery) {
    if (Bullet.active[eid] === 0) continue

    Position.y[eid] += Bullet.speed[eid] * Bullet.direction[eid] * delta

    // Disable bullets outside screen
    if (Position.y[eid] < -20 || Position.y[eid] > canvas.height + 20) {
      Bullet.active[eid] = 0
    }
  }
}

/**
 * Input system.
 *
 * Systems:
 * - read component data
 * - mutate component data
 *
 * This system only modifies velocity.
 */

export function inputSystem(playerQuery: QueryResult, context: InputContext) {
  for (const eid of playerQuery) {
    handleMovement(eid, context.keys)
    updateShootCooldown(eid, context.delta)
    handleShooting(eid, context)
  }
}

function handleMovement(eid: number, keys: Record<string, boolean>) {
  const speed = Player.speed[eid]

  Velocity.x[eid] = 0

  if (keys.a || keys.ArrowLeft) {
    Velocity.x[eid] = -speed
  }

  if (keys.d || keys.ArrowRight) {
    Velocity.x[eid] = speed
  }
}

function updateShootCooldown(eid: number, delta: number) {
  if (Player.shootCooldown[eid] <= 0) {
    return
  }

  Player.shootCooldown[eid] -= delta
}

function handleShooting(eid: number, context: InputContext) {
  if (!isShootPressed(context.keys)) {
    return
  }

  if (Player.shootCooldown[eid] > 0) {
    return
  }

  createBullet(context.world, Position.x[eid] + 27, Position.y[eid], -1)

  Player.shootCooldown[eid] = 0.2
}

function isShootPressed(keys: Record<string, boolean>) {
  return keys[' '] || keys.Space
}

/**
 * Render system.
 *
 * Rendering is also ECS logic.
 */
export function renderSystem(renderQuery: QueryResult, context: RenderContext) {
  renderBackground(context)
  renderStars(context)

  for (const eid of renderQuery) {
    renderEntity(context.ctx, eid)
  }
}

function renderBackground({ ctx, canvas }: RenderContext) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function renderStars({ ctx, canvas }: RenderContext) {
  ctx.fillStyle = '#222'

  Array.from({ length: 80 }).forEach((_, index) => {
    ctx.fillRect(
      (index * 97) % canvas.width,
      (index * 53) % canvas.height,
      2,
      2
    )
  })
}

function renderEntity(ctx: CanvasRenderingContext2D, eid: number) {
  if (!isRenderable(eid)) {
    return
  }

  ctx.fillStyle = getEntityColor(eid)

  ctx.fillRect(
    Position.x[eid],
    Position.y[eid],
    Renderable.width[eid],
    Renderable.height[eid]
  )
}

function isRenderable(eid: number) {
  const deadEnemy = Enemy.alive[eid] !== undefined && Enemy.alive[eid] === 0

  const inactiveBullet =
    Bullet.active[eid] !== undefined && Bullet.active[eid] === 0

  return !deadEnemy && !inactiveBullet
}

function isPlayer(eid: number) {
  return Player.speed[eid] !== undefined
}

function isEnemy(eid: number) {
  return Enemy.alive[eid] !== undefined
}

function isBullet(eid: number) {
  return Bullet.active[eid] !== undefined
}

function getEntityColor(eid: number) {
  if (isPlayer(eid)) return '#00ff88'
  if (isEnemy(eid)) return '#ff3366'
  if (isBullet(eid)) return '#ffee55'

  return 'white'
}

/**
 * Enemy system.
 *
 * Enemies descend constantly.
 */
export function enemySystem(
  world: World,
  enemyQuery: QueryResult,
  canvas: HTMLCanvasElement
) {
  for (const eid of enemyQuery) {
    if (Enemy.alive[eid] === 0) continue

    /**
     * Lose condition:
     * Enemy reached player zone.
     */

    if (Position.y[eid] > canvas.height - 120) {
      console.log('GAME OVER')
    }
  }
}

/**
 * Collision system.
 *
 * ECS systems often read multiple component groups.
 */
export function collisionSystem(
  bulletQuery: QueryResult,
  enemyQuery: QueryResult,
  context: CollisionContext
) {
  for (const bulletEid of bulletQuery) {
    if (!isBulletActive(bulletEid)) {
      continue
    }

    for (const enemyEid of enemyQuery) {
      if (!isEnemyAlive(enemyEid)) {
        continue
      }

      if (!intersects(bulletEid, enemyEid)) {
        continue
      }

      handleBulletHit(bulletEid, enemyEid, context.scoreEid)
    }
  }
}

function isBulletActive(bulletEid: number) {
  return Bullet.active[bulletEid] !== 0
}

function isEnemyAlive(enemyEid: number) {
  return Enemy.alive[enemyEid] !== 0
}

function intersects(bulletEid: number, enemyEid: number) {
  return (
    Position.x[bulletEid] < Position.x[enemyEid] + Renderable.width[enemyEid] &&
    Position.x[bulletEid] + Renderable.width[bulletEid] >
      Position.x[enemyEid] &&
    Position.y[bulletEid] <
      Position.y[enemyEid] + Renderable.height[enemyEid] &&
    Position.y[bulletEid] + Renderable.height[bulletEid] > Position.y[enemyEid]
  )
}

function handleBulletHit(
  bulletEid: number,
  enemyEid: number,
  scoreEid: number
) {
  Bullet.active[bulletEid] = 0

  Health.value[enemyEid] -= 1

  if (Health.value[enemyEid] > 0) {
    return
  }

  Enemy.alive[enemyEid] = 0
  Score.value[scoreEid] += 100
}

/**
 * Player bounds system.
 *
 * Keep player inside screen.
 */
export function playerBoundsSystem(
  playerEid: number,
  canvas: HTMLCanvasElement
) {
  const eid = playerEid

  if (Position.x[eid] < 0) {
    Position.x[eid] = 0
  }

  const maxX = canvas.width - Renderable.width[eid]

  if (Position.x[eid] > maxX) {
    Position.x[eid] = maxX
  }
}
