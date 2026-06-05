/**
 * Sprite component for BitECS.
 * This component defines sprite properties for entities in the entity-component-system.
 *
 * @property {string[]} name - Array of sprite names
 * @property {string[]} texture - Array of texture asset paths
 * @property {number[]} columns - Number of columns in the sprite sheet
 * @property {number[]} rows - Number of rows in the sprite sheet
 * @property {number[]} width - Width of individual sprite frames
 * @property {number[]} height - Height of individual sprite frames
 */
export const Sprite = {
  name: [] as string[],
  texture: [] as string[],
  columns: [] as number[],
  rows: [] as number[],
  width: [] as number[],
  height: [] as number[]
}
