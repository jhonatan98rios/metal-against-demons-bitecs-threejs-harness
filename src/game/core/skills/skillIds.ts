/** Skill type identifiers. Add new skills here as the game grows. */
export const SKILL_ID = {
  NONE: 0,
  PROJECTILE: 1
} as const

export type SkillId = (typeof SKILL_ID)[keyof typeof SKILL_ID]
