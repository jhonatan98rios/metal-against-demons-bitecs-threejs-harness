import { query, removeEntity, asBuffer, World } from 'bitecs'

import { Active } from '../core/shared/components/Active'
import { Animation } from '../core/shared/components/Animation'
import { AnimationRow } from '../core/shared/components/AnimationRow'
import { Health } from '../core/shared/components/Health'
import { Position } from '../core/shared/components/Position'
import { Velocity } from '../core/shared/components/Velocity'
import { MAX_COMMANDS } from '../core/shared/constants'

import type { ComponentTransfer, WorkerMessage, WorkerResponse } from './types'
import { processPartition } from './processors'

const SAB_SUPPORTED =
  typeof SharedArrayBuffer !== 'undefined' && typeof Worker !== 'undefined'

const BUF: ComponentTransfer = {
  Active: { isActive: Active.isActive.buffer },
  Animation: {
    currentFrame: Animation.currentFrame.buffer,
    elapsed: Animation.elapsed.buffer,
    fps: Animation.fps.buffer,
    startFrame: Animation.startFrame.buffer,
    endFrame: Animation.endFrame.buffer
  },
  AnimationRow: { row: AnimationRow.row.buffer },
  Health: { current: Health.current.buffer },
  Position: {
    x: Position.x.buffer,
    y: Position.y.buffer,
    z: Position.z.buffer
  },
  Velocity: {
    x: Velocity.x.buffer,
    z: Velocity.z.buffer
  }
}

export type WorkerPool = {
  update(dt: number): void
  destroy(): void
}

type PerWorkerQueues = {
  remove: Uint32Array
  move: Float32Array
}

function flushRemoveQueue(world: World, eids: Readonly<Uint32Array>): void {
  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < eids.length; i++) {
    removeEntity(world, eids[i])
  }
}

type PoolState = {
  completedWorkers: number
  removeCounts: number[]
  moveCounts: number[]
  perWorkerQueues: PerWorkerQueues[]
  workers: Worker[]
  world: World
  workerCount: number
}

function processAllQueues(state: PoolState): void {
  const { completedWorkers, removeCounts, perWorkerQueues, world } = state

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < completedWorkers; i++) {
    if (removeCounts[i] > 0) {
      flushRemoveQueue(
        world,
        perWorkerQueues[i].remove.subarray(0, removeCounts[i])
      )
    }
  }
}

function allocateQueues(count: number): PerWorkerQueues[] {
  return Array.from({ length: count }, () => ({
    remove: new Uint32Array(
      new SharedArrayBuffer(MAX_COMMANDS * Uint32Array.BYTES_PER_ELEMENT)
    ),
    move: new Float32Array(
      new SharedArrayBuffer(MAX_COMMANDS * 3 * Float32Array.BYTES_PER_ELEMENT)
    )
  }))
}

function createSingleWorker(
  wi: number,
  perWorkerQueues: PerWorkerQueues[],
  state: PoolState
): Worker {
  const worker = new Worker(new URL('./game.worker.ts', import.meta.url), {
    type: 'module'
  })

  const initMsg: WorkerMessage = {
    type: 'init',
    components: BUF,
    removeQueueBuffer: perWorkerQueues[wi]
      .remove as unknown as SharedArrayBuffer,
    moveQueueBuffer: perWorkerQueues[wi].move as unknown as SharedArrayBuffer
  }

  worker.postMessage(initMsg)

  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const res = e.data

    state.removeCounts[wi] = res.removeCount
    state.moveCounts[wi] = res.moveCount
    state.completedWorkers++

    if (state.completedWorkers === state.workerCount) {
      processAllQueues(state)
      state.completedWorkers = 0
    }
  }

  return worker
}

function makePoolUpdater(
  state: PoolState,
  workerCount: number
): (dt: number) => void {
  const { workers, world } = state

  return (dt: number) => {
    // ponytail: removed Velocity from query — entities without Velocity (e.g. spiral projectiles)
    // still need animation processing. Velocity.x/z defaults to 0 in SAB, so position stays unchanged.
    const entities = query(
      world,
      [Active, Animation],
      asBuffer
    ) as Readonly<Uint32Array>

    if (entities.length === 0) return

    const partitionSize = Math.ceil(entities.length / workerCount)

    // eslint-disable-next-line functional/no-let
    for (let wi = 0, start = 0; wi < workerCount; wi++) {
      const end = Math.min(start + partitionSize, entities.length)
      if (start >= entities.length) break
      workers[wi].postMessage({
        type: 'update',
        entities: entities.subarray(start, end),
        dt
      } satisfies WorkerMessage)
      start = end
    }
  }
}

function makePoolDestroyer(workers: readonly Worker[]): () => void {
  return () => {
    for (const w of workers) {
      w.terminate()
    }
  }
}

function createWorkerPoolImpl(world: World): WorkerPool {
  const workerCount = Math.max(1, (navigator.hardwareConcurrency || 2) - 1)

  const perWorkerQueues = allocateQueues(workerCount)
  const removeCounts: number[] = Array.from({ length: workerCount }, () => 0)
  const moveCounts: number[] = Array.from({ length: workerCount }, () => 0)

  const state: PoolState = {
    completedWorkers: 0,
    removeCounts,
    moveCounts,
    perWorkerQueues,
    workers: [],
    world,
    workerCount
  }

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < workerCount; i++) {
    const worker = createSingleWorker(i, perWorkerQueues, state)

    state.workers.push(worker)
  }

  return {
    update: makePoolUpdater(state, workerCount),
    destroy: makePoolDestroyer(state.workers)
  }
}

function createFallbackPool(world: World): WorkerPool {
  return {
    update(dt: number) {
      const entities = query(world, [Active, Animation])

      const removeAcc: number[] = []

      processPartition({
        entities: new Uint32Array(entities),
        dt,
        active: Active,
        animation: Animation,
        position: Position,
        velocity: Velocity,
        health: Health,
        removeQueue: removeAcc,
        moveQueue: []
      })

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < removeAcc.length; i++) {
        removeEntity(world, removeAcc[i])
      }
    },

    destroy() {
      // no-op
    }
  }
}

export function createWorkerPool(world: World): WorkerPool {
  if (!SAB_SUPPORTED) {
    return createFallbackPool(world)
  }

  return createWorkerPoolImpl(world)
}
