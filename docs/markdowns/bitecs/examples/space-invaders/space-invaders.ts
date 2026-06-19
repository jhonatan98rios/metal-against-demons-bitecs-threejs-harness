/**
 * Space Invaders style example using:
 * - Canvas 2D
 * - bitecs ECS
 * - Components / Entities / Systems
 *
 * Goal:
 * Self-contained ECS example for RAG/documentation.
 *
 * Repeated ECS concepts on purpose:
 * - Components = data only
 * - Entities = numeric ids
 * - Systems = logic operating on queries
 *
 * Inspired by the bitecs patterns from the provided examples:
 * - Components as SoA typed arrays
 * - query(world, [...])
 * - Small focused systems
 */

import { createWorld } from 'bitecs'
import { createEnemy, createPlayer, createScore } from './entities'
import {
  bulletSystem,
  collisionSystem,
  enemySystem,
  inputSystem,
  movementSystem,
  playerBoundsSystem,
  renderSystem
} from './systems'
import { cachedQueriesFactory } from './queries'

/* =========================================================
   CANVAS
   ========================================================= */

const canvas = document.createElement('canvas')
canvas.width = 900
canvas.height = 700

document.body.style.margin = '0'
document.body.style.background = '#050505'

document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')!

/* =========================================================
   ECS WORLD
   ========================================================= */

/**
 * ECS World:
 * Holds all entities/components.
 *
 * Systems receive the world and mutate data.
 */
const world = createWorld()

/* =========================================================
   ENTITIES
   ========================================================= */

const playerEid = createPlayer(world, canvas)
const scoreEid = createScore(world)

/**
 * Create enemy wave.
 *
 * ECS games often use factories/spawners.
 */
Array.from({ length: 5 }).forEach((_, row) => {
  Array.from({ length: 10 }).forEach((_, col) => {
    createEnemy(world, 80 + col * 70, 40 + row * 60)
  })
})

/* =========================================================
   INPUT
   ========================================================= */

const keys: Record<string, boolean> = {}

window.addEventListener('keydown', (e) => {
  keys[e.key] = true
})

window.addEventListener('keyup', (e) => {
  keys[e.key] = false
})

/* =========================================================
   QUERIES
   ========================================================= */

const { bulletQuery, enemyQuery, movementQuery, playerQuery, renderQuery } =
  cachedQueriesFactory(world)

/* =========================================================
   MAIN LOOP
   ========================================================= */

/**
 * ECS loop order:
 * 1. Input
 * 2. Simulation
 * 3. Collision
 * 4. Rendering
 */

const D = {
  last: performance.now()
}

function gameLoop(now: number) {
  const delta = (now - D.last) / 1000
  D.last = now

  inputSystem(playerQuery, {
    world,
    delta,
    keys
  })

  movementSystem(world, delta, movementQuery)

  bulletSystem(world, delta, canvas, bulletQuery)

  playerBoundsSystem(playerEid, canvas)

  collisionSystem(bulletQuery, enemyQuery, {
    world,
    scoreEid
  })

  enemySystem(world, enemyQuery, canvas)

  renderSystem(renderQuery, {
    world,
    ctx,
    canvas
  })

  requestAnimationFrame(gameLoop)
}

requestAnimationFrame(gameLoop)
