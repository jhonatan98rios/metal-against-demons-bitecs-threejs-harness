import type { SkillDefinition } from './types'

const registry = new Map<number, SkillDefinition>()

export function registerSkill(def: SkillDefinition): void {
  registry.set(def.id, def)
}

export function getSkill(id: number): SkillDefinition | undefined {
  return registry.get(id)
}

export function getAllSkills(): SkillDefinition[] {
  return [...registry.values()]
}
