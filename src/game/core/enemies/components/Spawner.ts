/**
 * Spawner component — per-pool enemy spawn pacing data.
 * One entity per enemy pool; the entity IS the pool manager, the component
 * holds its data (no closures carrying counters).
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 */
import { MAX_ENTITIES, sab } from '../../shared/constants'

export const Spawner = {
  /** Seconds between spawns (base value taken from the phase) */
  interval: sab.f32(MAX_ENTITIES),
  /** Time accumulated since the last spawn */
  accumulator: sab.f32(MAX_ENTITIES),
  /** Enemies spawned so far by this pool */
  spawned: sab.u16(MAX_ENTITIES),
  /** Total enemies this pool must spawn this phase */
  total: sab.u16(MAX_ENTITIES),
  /** Index into the spawn system's pool registry */
  poolIndex: sab.u8(MAX_ENTITIES)
}
