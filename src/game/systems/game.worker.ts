/**
 * Game worker — processes entity updates (animation, velocity integration) in a background thread.
 *
 * Receives SharedArrayBuffer-backed component views and entity partitions from the main thread.
 * Writes command queues directly to pre-allocated SharedArrayBuffer queues (zero-copy).
 * Sends back only counts — main thread reads the shared memory.
 */

import type { WorkerMessage, WorkerInitMessage, WorkerResponse } from './types'
import type { ActiveData } from './processors'

interface ComponentViews {
  Active: ActiveData
  Animation: {
    currentFrame: Uint16Array
    elapsed: Float32Array
    fps: Float32Array
    startFrame: Uint16Array
    endFrame: Uint16Array
  }
  Health: { current: Float32Array }
  Position: {
    x: Float32Array
    y: Float32Array
    z: Float32Array
  }
  Velocity: {
    x: Float32Array
    z: Float32Array
  }
}

function createViewsFromBuffers(msg: WorkerInitMessage): ComponentViews {
  const { components: c } = msg

  return {
    Active: { isActive: new Uint8Array(c.Active.isActive) },
    Animation: {
      currentFrame: new Uint16Array(c.Animation.currentFrame),
      elapsed: new Float32Array(c.Animation.elapsed),
      fps: new Float32Array(c.Animation.fps),
      startFrame: new Uint16Array(c.Animation.startFrame),
      endFrame: new Uint16Array(c.Animation.endFrame)
    },
    Health: { current: new Float32Array(c.Health.current) },
    Position: {
      x: new Float32Array(c.Position.x),
      y: new Float32Array(c.Position.y),
      z: new Float32Array(c.Position.z)
    },
    Velocity: {
      x: new Float32Array(c.Velocity.x),
      z: new Float32Array(c.Velocity.z)
    }
  }
}

const state: {
  comps: ComponentViews | null
  removeQueue: Uint32Array | null
  moveQueue: Float32Array | null
} = {
  comps: null,
  removeQueue: null,
  moveQueue: null
}

function updateOneEntity(eid: number, dt: number, c: ComponentViews): void {
  c.Animation.elapsed[eid] += dt

  const frameDuration = 1 / c.Animation.fps[eid]

  if (c.Animation.elapsed[eid] >= frameDuration) {
    c.Animation.elapsed[eid] = 0
    c.Animation.currentFrame[eid]++

    if (c.Animation.currentFrame[eid] > c.Animation.endFrame[eid]) {
      c.Animation.currentFrame[eid] = c.Animation.startFrame[eid]
    }
  }

  c.Position.x[eid] += c.Velocity.x[eid] * dt
  c.Position.z[eid] += c.Velocity.z[eid] * dt
}

function collectRemoves(
  entities: Readonly<Uint32Array>,
  c: ComponentViews,
  removeQueue: Uint32Array,
  counts: { remove: number; move: number }
): void {
  for (const idx of Array.from({ length: entities.length }, (_, i) => i)) {
    const eid = entities[idx]

    if (c.Active.isActive[eid] === 0) continue
    if (c.Health.current[eid] > 0) continue

    if (counts.remove < removeQueue.length) {
      removeQueue[counts.remove] = eid
      counts.remove++
    }
  }
}

function collectMoves(
  entities: Readonly<Uint32Array>,
  c: ComponentViews,
  moveQueue: Float32Array,
  counts: { remove: number; move: number }
): void {
  for (const idx of Array.from({ length: entities.length }, (_, i) => i)) {
    const eid = entities[idx]

    if (c.Active.isActive[eid] === 0) continue
    if (counts.move + 3 > moveQueue.length) continue

    moveQueue[counts.move] = eid
    moveQueue[counts.move + 1] = c.Position.x[eid]
    moveQueue[counts.move + 2] = c.Position.z[eid]
    counts.move += 3
  }
}

function processAndCollect(
  entities: Readonly<Uint32Array>,
  dt: number,
  c: ComponentViews
): { removeCount: number; moveCount: number } {
  for (const idx of Array.from({ length: entities.length }, (_, i) => i)) {
    const eid = entities[idx]

    if (c.Active.isActive[eid] === 0) continue

    updateOneEntity(eid, dt, c)
  }

  const counts = { remove: 0, move: 0 }

  collectRemoves(entities, c, state.removeQueue!, counts)
  collectMoves(entities, c, state.moveQueue!, counts)

  return { removeCount: counts.remove, moveCount: counts.move }
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data

  if (msg.type === 'init') {
    state.comps = createViewsFromBuffers(msg)
    state.removeQueue = new Uint32Array(msg.removeQueueBuffer)
    state.moveQueue = new Float32Array(msg.moveQueueBuffer)
    return
  }

  if (msg.type === 'update') {
    const c = state.comps

    if (!c) return

    const { removeCount, moveCount } = processAndCollect(
      msg.entities,
      msg.dt,
      c
    )

    const response: WorkerResponse = { type: 'done', removeCount, moveCount }

    self.postMessage(response)
  }
}
