/**
 * Pure processing functions shared between Web Workers and fallback path.
 *
 * All functions operate on SharedArrayBuffer-backed typed arrays directly.
 * No classes, no state — just ECS data in, mutations applied.
 */

interface AnimationData {
  currentFrame: Uint16Array
  elapsed: Float32Array
  fps: Float32Array
  startFrame: Uint16Array
  endFrame: Uint16Array
}

interface MovementData {
  x: Float32Array
  y: Float32Array
  z: Float32Array
}

interface VelocityData {
  x: Float32Array
  z: Float32Array
}

interface ActiveData {
  isActive: Uint8Array
}

interface AnimationInput {
  entities: Readonly<Uint32Array>
  active: ActiveData
  animation: AnimationData
  dt: number
}

interface MovementInput {
  entities: Readonly<Uint32Array>
  active: ActiveData
  position: MovementData
  velocity: VelocityData
  dt: number
}

interface EntityInput {
  eid: number
  active: ActiveData
}

interface RemoveQueueInput {
  entities: Readonly<Uint32Array>
  active: ActiveData
  health: { current: Float32Array } | null
  out: number[]
}

interface MoveQueueInput {
  entities: Readonly<Uint32Array>
  active: ActiveData
  position: MovementData
  out: number[]
}

interface PartitionInput {
  entities: Readonly<Uint32Array>
  dt: number
  active: ActiveData
  animation: AnimationData | null
  position: MovementData | null
  velocity: VelocityData | null
  health: { current: Float32Array } | null
  removeQueue: number[]
  moveQueue: number[]
}

function isActive(input: EntityInput): boolean {
  return input.active.isActive[input.eid] !== 0
}

/**
 * Process animation frame cycling for a single entity.
 * Mutates Animation arrays in place.
 */
/**
 * Process animation frame cycling for a partition of entities.
 * Mutates Animation arrays in place.
 */
export function updateAnimations(input: AnimationInput): void {
  const { entities, active, animation, dt } = input
  const len = entities.length

  for (const idx of Array.from({ length: len }, (_, i) => i)) {
    const eid = entities[idx]

    if (active.isActive[eid] === 0) continue

    animation.elapsed[eid] += dt

    const frameDuration = 1 / animation.fps[eid]

    if (animation.elapsed[eid] >= frameDuration) {
      animation.elapsed[eid] = 0
      animation.currentFrame[eid]++

      if (animation.currentFrame[eid] > animation.endFrame[eid]) {
        animation.currentFrame[eid] = animation.startFrame[eid]
      }
    }
  }
}

/**
 * Integrate velocity into position for a single entity.
 */
function updateOneMovement(input: MovementInput, eid: number): void {
  if (!isActive({ eid, active: input.active })) return

  input.position.x[eid] += input.velocity.x[eid] * input.dt
  input.position.z[eid] += input.velocity.z[eid] * input.dt
}

/**
 * Integrate velocity into position for a partition of entities.
 */
export function updateMovement(input: MovementInput): void {
  const { entities } = input

  for (const idx of Array.from({ length: entities.length }, (_, i) => i)) {
    updateOneMovement(input, entities[idx])
  }
}

/**
 * Collect entities whose health has dropped to zero or below.
 * Appends their entity IDs to the output array.
 */
export function collectRemoveQueue(input: RemoveQueueInput): void {
  const { entities, active, health, out } = input

  if (!health) return

  for (const idx of Array.from({ length: entities.length }, (_, i) => i)) {
    const eid = entities[idx]

    if (!isActive({ eid, active })) continue
    if (health.current[eid] <= 0) {
      out.push(eid)
    }
  }
}

/**
 * Collect flat [eid, x, z] triples for every processed entity.
 */
export function collectMoveQueue(input: MoveQueueInput): void {
  const { entities, active, position, out } = input

  for (const idx of Array.from({ length: entities.length }, (_, i) => i)) {
    const eid = entities[idx]

    if (!isActive({ eid, active })) continue

    out.push(eid, position.x[eid], position.z[eid])
  }
}

/**
 * Run all processing steps for a partition of entities.
 */
export function processPartition(input: PartitionInput): void {
  const {
    entities,
    dt,
    active,
    animation,
    position,
    velocity,
    health,
    removeQueue,
    moveQueue
  } = input

  if (animation) {
    updateAnimations({ entities, active, animation, dt })
  }

  if (position && velocity) {
    updateMovement({ entities, active, position, velocity, dt })
  }

  collectRemoveQueue({ entities, active, health, out: removeQueue })

  if (position) {
    collectMoveQueue({ entities, active, position, out: moveQueue })
  }
}

export type { AnimationData, MovementData, VelocityData, ActiveData }
export type {
  AnimationInput,
  MovementInput,
  RemoveQueueInput,
  MoveQueueInput,
  PartitionInput
}
