/**
 * Game worker — advances sprite animation and integrates velocity for an
 * entity partition in a background thread.
 *
 * Receives SharedArrayBuffer-backed component views plus a shared entity-ID
 * buffer and mutates them in place (zero-copy). Entity lifecycle is owned by
 * main-thread systems, so the worker never removes entities.
 */

import type { WorkerMessage, WorkerInitMessage } from './types'
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
  entityBuffer: Uint32Array | null
} = {
  comps: null,
  entityBuffer: null
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

function updatePartition(
  entities: Readonly<Uint32Array>,
  dt: number,
  c: ComponentViews
): void {
  for (const eid of entities) {
    updateOneEntity(eid, dt, c)
  }
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data

  if (msg.type === 'init') {
    state.comps = createViewsFromBuffers(msg)
    state.entityBuffer = new Uint32Array(msg.entityBuffer)
    return
  }

  const c = state.comps
  if (!c || !state.entityBuffer) return

  // ponytail: read entity partition from shared buffer — zero copy from main thread
  const entities = state.entityBuffer.subarray(msg.start, msg.start + msg.count)

  updatePartition(entities, msg.dt, c)
}
