/**
 * Animation component for BitECS.
 * This component defines animation properties for entities in the entity-component-system.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Uint16Array} currentFrame - Current frame index in the animation sequence
 * @property {Float32Array} elapsed - Time elapsed since the last frame change
 * @property {Float32Array} fps - Frames per second for the animation playback speed
 * @property {Uint16Array} startFrame - Starting frame index for the animation loop
 * @property {Uint16Array} endFrame - Ending frame index for the animation loop
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Animation = {
  currentFrame: sab.u16(MAX_ENTITIES),
  elapsed: sab.f32(MAX_ENTITIES),
  fps: sab.f32(MAX_ENTITIES),
  startFrame: sab.u16(MAX_ENTITIES),
  endFrame: sab.u16(MAX_ENTITIES)
}
