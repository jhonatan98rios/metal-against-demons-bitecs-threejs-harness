/**
 * Maximum number of entities the ECS world can hold.
 * This determines the size of SharedArrayBuffer-backed component arrays.
 * Set high enough to accommodate enemies, bullets, particles, etc.
 */
export const MAX_ENTITIES = 100_000

const SAB = (byteLength: number) => new SharedArrayBuffer(byteLength)

export const sab = {
  f32: (n: number) => new Float32Array(SAB(n * 4)),
  u8: (n: number) => new Uint8Array(SAB(n * 1)),
  u16: (n: number) => new Uint16Array(SAB(n * 2))
}
