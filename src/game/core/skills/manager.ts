import { addComponent, addEntity, query, removeEntity, World } from 'bitecs'

import { Skill } from './components/Skill'
import { getSkill, getAllSkills } from './registry'
import type { SkillSystems, SkillUpgradeOption } from './types'

type ActiveEntry = {
  eid: number
  systems: SkillSystems
  skillId: number
}

function buildUpgradeOptions(
  active: Map<number, ActiveEntry>
): SkillUpgradeOption[] {
  const options: SkillUpgradeOption[] = []

  // 1. Active skills that can still be upgraded
  for (const [, entry] of active) {
    const def = getSkill(entry.skillId)
    if (!def) continue
    const currentLevel = Skill.level[entry.eid]
    if (currentLevel >= def.maxLevel) continue
    const nextLevel = currentLevel + 1
    const upg = def.upgrades.find((u) => u.level === nextLevel)

    options.push({
      icon: def.icon,
      label: `${def.name} Lv.${nextLevel}`,
      description: upg
        ? Object.entries(upg.patch)
            .map(([k, v]) => `${k} +${v}`)
            .join(', ')
        : 'Upgrade',
      detail: def.getDetail(nextLevel),
      skillEid: entry.eid,
      skillId: entry.skillId,
      nextLevel
    })
  }

  // 2. Skills not yet active
  const activeIds = new Set([...active.values()].map((e) => e.skillId))
  for (const def of getAllSkills()) {
    if (activeIds.has(def.id)) continue

    options.push({
      icon: def.icon,
      label: `${def.name} Lv.1`,
      description: def.description,
      detail: def.getDetail(1),
      skillEid: 0,
      skillId: def.id,
      nextLevel: 1
    })
  }

  return options
}

function pickRandomOptions<T>(options: T[], count: number): T[] {
  // ponytail: Fisher-Yates shuffle then slice
  // eslint-disable-next-line functional/no-let
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = options[i]
    options[i] = options[j]
    options[j] = tmp
  }
  return options.slice(0, count)
}

function activateSkill(
  world: World,
  playerEid: number,
  active: Map<number, ActiveEntry>,
  skillId: number,
  level: number
): number {
  const def = getSkill(skillId)
  if (!def) return -1

  const eid = addEntity(world)
  addComponent(world, eid, Skill)
  Skill.skillId[eid] = skillId
  Skill.level[eid] = level

  const systems = def.create(world, playerEid, level)
  active.set(eid, { eid, systems, skillId })
  return eid
}

function deactivateSkill(
  world: World,
  active: Map<number, ActiveEntry>,
  eid: number
): void {
  const entry = active.get(eid)
  if (!entry) return
  entry.systems.destroy()
  active.delete(eid)
  Skill.skillId[eid] = 0
  Skill.level[eid] = 0
  removeEntity(world, eid)
}

function upgradeSkill(active: Map<number, ActiveEntry>, eid: number): void {
  const entry = active.get(eid)
  if (!entry) return
  const def = getSkill(entry.skillId)
  if (!def || Skill.level[eid] >= def.maxLevel) return
  Skill.level[eid] += 1
  entry.systems.setLevel(Skill.level[eid])
}

function updateSkills(
  world: World,
  active: Map<number, ActiveEntry>,
  dt: number
): void {
  const skillEntities = query(world, [Skill])
  const alive = new Set(skillEntities)
  for (const [eid, entry] of active) {
    if (!alive.has(eid)) {
      entry.systems.destroy()
      active.delete(eid)
      continue
    }
    entry.systems.update(dt)
  }
}

export function createSkillManager(world: World) {
  const w = world as World & { playerEid?: number }
  const active = new Map<number, ActiveEntry>()

  return {
    activate(skillId: number, level = 1): number {
      if (typeof w.playerEid !== 'number') return -1
      return activateSkill(world, w.playerEid, active, skillId, level)
    },

    deactivate(eid: number): void {
      deactivateSkill(world, active, eid)
    },

    upgrade(eid: number): void {
      upgradeSkill(active, eid)
    },

    getUpgradeOptions(): SkillUpgradeOption[] {
      if (typeof w.playerEid !== 'number') return []
      return pickRandomOptions(buildUpgradeOptions(active), 3)
    },

    applyUpgradeChoice(option: SkillUpgradeOption): void {
      if (option.skillEid > 0) {
        upgradeSkill(active, option.skillEid)
      } else if (typeof w.playerEid === 'number') {
        activateSkill(world, w.playerEid, active, option.skillId, 1)
      }
    },

    update(dt: number): void {
      updateSkills(world, active, dt)
    },

    destroy(): void {
      for (const [, entry] of active) entry.systems.destroy()
      active.clear()
    }
  }
}
