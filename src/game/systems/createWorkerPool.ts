import { Not, query, asBuffer, World } from 'bitecs'

import { Active } from '../core/shared/components/Active'
import { Animation } from '../core/shared/components/Animation'
import { AnimationRow } from '../core/shared/components/AnimationRow'
import { Inactive } from '../core/shared/components/Inactive'
import { Position } from '../core/shared/components/Position'
import { Velocity } from '../core/shared/components/Velocity'
import { MAX_ENTITIES } from '../core/shared/constants'

import type { ComponentTransfer, WorkerMessage } from './types'
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

type SharedState = {
  /** Shared buffer for entity-ID partitions. Main thread copies query results here once per frame. */
  entityIds: Uint32Array
  entitySAB: SharedArrayBuffer
}

function createSingleWorker(shared: SharedState): Worker {
  const worker = new Worker(new URL('./game.worker.ts', import.meta.url), {
    type: 'module'
  })

  worker.postMessage({
    type: 'init',
    components: BUF,
    entityBuffer: shared.entitySAB
  } satisfies WorkerMessage)

  return worker
}

function makePoolUpdater(
  world: World,
  workers: readonly Worker[],
  shared: SharedState
): (dt: number) => void {
  const workerCount = workers.length

  return (dt: number) => {
    const entities = query(
      world,
      [Animation, Not(Inactive)],
      asBuffer
    ) as Readonly<Uint32Array>

    if (entities.length === 0) return

    // ponytail: copy entity IDs into shared buffer once per frame.
    // Workers read partitions via subarray() — zero structured-clone overhead
    shared.entityIds.set(entities)

    const partitionSize = Math.ceil(entities.length / workerCount)

    // eslint-disable-next-line functional/no-let
    for (let wi = 0, start = 0; wi < workerCount; wi++) {
      const count = Math.min(partitionSize, entities.length - start)
      if (count <= 0) break
      workers[wi].postMessage({
        type: 'update',
        start,
        count,
        dt
      } satisfies WorkerMessage)
      start += count
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

  const entitySAB = new SharedArrayBuffer(
    MAX_ENTITIES * Uint32Array.BYTES_PER_ELEMENT
  )
  const shared: SharedState = {
    entityIds: new Uint32Array(entitySAB),
    entitySAB
  }

  const workers = Array.from({ length: workerCount }, () =>
    createSingleWorker(shared)
  )

  return {
    update: makePoolUpdater(world, workers, shared),
    destroy: makePoolDestroyer(workers)
  }
}

function createFallbackPool(world: World): WorkerPool {
  return {
    update(dt: number) {
      const entities = query(world, [Animation, Not(Inactive)])

      processPartition({
        entities: new Uint32Array(entities),
        dt,
        active: Active,
        animation: Animation,
        position: Position,
        velocity: Velocity
      })
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
