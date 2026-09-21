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
  /** Shared entity-ID buffer. Workers read partitions via subarray(start, start+count). */
  entityBuffer: SharedArrayBuffer
}

export type WorkerUpdateMessage = {
  type: 'update'
  /** Offset into the shared entity buffer (in elements, not bytes). */
  start: number
  /** Number of entity IDs in this partition. */
  count: number
  dt: number
}

export type WorkerMessage = WorkerInitMessage | WorkerUpdateMessage
