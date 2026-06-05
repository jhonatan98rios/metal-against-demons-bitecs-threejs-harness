/**
 * Animation component for BitECS.
 * This component defines animation properties for entities in the entity-component-system.
 *
 * @property {number[]} currentFrame - Current frame index in the animation sequence
 * @property {number[]} elapsed - Time elapsed since the last frame change
 * @property {number[]} fps - Frames per second for the animation playback speed
 * @property {number[]} startFrame - Starting frame index for the animation loop
 * @property {number[]} endFrame - Ending frame index for the animation loop
 */
export const Animation = {
  currentFrame: [] as number[],
  elapsed: [] as number[],
  fps: [] as number[],
  startFrame: [] as number[],
  endFrame: [] as number[]
}
