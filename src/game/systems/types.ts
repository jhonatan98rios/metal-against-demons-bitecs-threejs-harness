/**
 * Component array buffers shared with workers via postMessage (transferable).
 * Workers create their own TypedArray views over these SharedArrayBuffers.
 */
export interface ComponentTransfer {
  Active: { isActive: ArrayBufferLike }
  Animation: {
    currentFrame: ArrayBufferLike
    elapsed: ArrayBufferLike
    fps: ArrayBufferLike
    startFrame: ArrayBufferLike
    endFrame: ArrayBufferLike
  }
  AnimationRow: { row: ArrayBufferLike }
  Health: { current: ArrayBufferLike }
  Position: {
    x: ArrayBufferLike
    y: ArrayBufferLike
    z: ArrayBufferLike
  }
  Velocity: {
    x: ArrayBufferLike
    z: ArrayBufferLike
  }
}

export type WorkerInitMessage = {
  type: 'init'
  components: ComponentTransfer
  removeQueueBuffer: SharedArrayBuffer
  moveQueueBuffer: SharedArrayBuffer
}

export type WorkerUpdateMessage = {
  type: 'update'
  entities: Uint32Array
  dt: number
}

export type WorkerMessage = WorkerInitMessage | WorkerUpdateMessage

/**
 * Per-frame response from each worker partition.
 *
 * Workers write directly to pre-allocated SharedArrayBuffer queues.
 * Only counts are sent back — main thread reads the shared memory.
 */
export type WorkerResponse = {
  type: 'done'
  removeCount: number
  moveCount: number
}
