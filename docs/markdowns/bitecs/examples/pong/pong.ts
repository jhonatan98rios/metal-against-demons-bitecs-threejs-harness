/**
 * Simple Pong using:
 * - Canvas 2D
 * - bitecs ECS
 * - Components, Entities and Systems
 *
 * Goal of this file:
 * Keep everything self-contained and easy for RAG chunking.
 *
 * Important ECS concepts repeated through the file on purpose:
 * - Components = pure data
 * - Entities = ids
 * - Systems = logic operating over queries
 *
 * Inspired by the bitecs style from the provided examples:
 * - Components as typed arrays
 * - Systems using query(world, [...])
 * - Data-oriented approach
 *
 * Reference style:
 * :contentReference[oaicite:0]{index=0}
 * :contentReference[oaicite:1]{index=1}
 * :contentReference[oaicite:2]{index=2}
 * :contentReference[oaicite:3]{index=3}
 */

import { createWorld } from 'bitecs'
import { cachedQueriesFactory } from './queries'
import {
  ballCollisionSystem,
  inputSystem,
  movementSystem,
  paddleBoundsSystem,
  renderSystem
} from './systems'
import {
  createPaddle as createPaddleEntity,
  createBall as createBallEntity,
  createScore as createScoreEntity
} from './entities'

/* =========================================================
   CANVAS SETUP
   ========================================================= */

/**
 * Simple canvas bootstrap.
 * Rendering is done manually using CanvasRenderingContext2D.
 */
const canvas = document.createElement('canvas')
canvas.width = 900
canvas.height = 500

document.body.style.margin = '0'
document.body.style.background = '#111'
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')!

/* =========================================================
   ECS WORLD
   ========================================================= */

/**
 * ECS World:
 * Central container holding entities/components.
 *
 * Systems receive the world and mutate component data.
 */
const world = createWorld()

/* =========================================================
   GAME ENTITIES
   ========================================================= */

const leftPaddle = createPaddleEntity(world, 30, 200)
const rightPaddle = createPaddleEntity(world, 850, 200)
const scoreEntity = createScoreEntity(world)
createBallEntity(world, canvas.width / 2, canvas.height / 2)

/* =========================================================
   INPUT
   ========================================================= */

/**
 * Very small keyboard input layer.
 *
 * Systems can read this state.
 */
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

const { ballQuery, movementQuery, paddleQuery, renderQuery } =
  cachedQueriesFactory(world)

/* =========================================================
   MAIN LOOP
   ========================================================= */

/**
 * Main ECS loop.
 *
 * Common ECS order:
 * 1. Input
 * 2. Simulation
 * 3. Collision
 * 4. Rendering
 */

const last = { value: performance.now() }

function gameLoop(now: number) {
  const delta = (now - last.value) / 1000
  last.value = now

  inputSystem(leftPaddle, rightPaddle, keys)

  movementSystem(movementQuery, delta)

  paddleBoundsSystem(paddleQuery, canvas)

  ballCollisionSystem(ballQuery, {
    canvas,
    leftPaddle,
    rightPaddle,
    scoreEntity
  })

  renderSystem(renderQuery, {
    ctx,
    canvas,
    scoreEntity
  })

  requestAnimationFrame(gameLoop)
}

requestAnimationFrame(gameLoop)
