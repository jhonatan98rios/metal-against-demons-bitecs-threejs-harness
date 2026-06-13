/**
 * Maximum number of entities the ECS world can hold.
 * This determines the size of SharedArrayBuffer-backed component arrays.
 * Set high enough to accommodate enemies, bullets, particles, etc.
 */
export const MAX_ENTITIES = 100_000

/**
 * Maximum commands per frame per queue (remove, move, spawn).
 * Used for SharedArrayBuffer-backed command queue buffers shared
 * between main thread and workers.
 */
export const MAX_COMMANDS = 10_000

const SAB_SUPPORTED = typeof SharedArrayBuffer !== 'undefined'

/**
 * Lazy SharedArrayBuffer allocation with fallback to plain arrays.
 * This ensures component initialization doesn't crash in environments
 * where SharedArrayBuffer is unavailable (SSR, older browsers, etc.).
 * Once the COOP/COEP headers take effect, SAB is available in the browser.
 */
const createBuffer = (byteLength: number): ArrayBufferLike =>
  SAB_SUPPORTED
    ? new SharedArrayBuffer(byteLength)
    : new ArrayBuffer(byteLength)

export const sab = {
  f32: (n: number) => new Float32Array(createBuffer(n * 4)),
  u8: (n: number) => new Uint8Array(createBuffer(n * 1)),
  u16: (n: number) => new Uint16Array(createBuffer(n * 2))
}
