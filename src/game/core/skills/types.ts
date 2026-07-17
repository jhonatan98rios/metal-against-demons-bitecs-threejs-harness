import type { World } from 'bitecs'

import type { LevelUpOption } from '../../ui/LevelUpModal'

/**
 * Contract every skill type must fulfill.
 * Each skill is a factory function that returns these systems.
 */
export type SkillSystems = {
  /** Called every frame while the skill is active. */
  update(dt: number): void
  /** Called when the skill is deactivated or the game ends. */
  destroy(): void
  /** Called on level-up. The skill applies its own stat changes. */
  setLevel(level: number): void
}

/**
 * Per-level stat patch. The `patch` keys are skill-specific stat names
 * (e.g. damage, speed, interval, count). `setLevel` accumulates all
 * patches up to the current level.
 */
export type LevelUpgrade = {
  level: number
  patch: Record<string, number>
}

/**
 * Static definition registered once per skill type.
 */
export type SkillDefinition = {
  id: number
  name: string
  icon: string
  description: string
  maxLevel: number
  upgrades: LevelUpgrade[]
  /** Factory: creates the runtime systems for this skill. */
  create(world: World, playerEid: number, level: number): SkillSystems
  /** Returns detail text for the level-up modal. Static, no instance needed. */
  getDetail(level: number): string
}

/**
 * What the SkillManager returns for the level-up modal.
 */
export type SkillUpgradeOption = LevelUpOption & {
  /** If > 0, this is an existing skill entity to upgrade. If 0, it's a new activation. */
  skillEid: number
  /** Which skill type this option refers to. */
  skillId: number
  /** What level the skill would be after this choice. */
  nextLevel: number
}
