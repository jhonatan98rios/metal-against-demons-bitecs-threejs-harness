import { registerSkill } from '../registry'
import { SKILL_ID } from '../skillIds'
import type { SkillDefinition } from '../types'
import {
  createProjectilePool,
  type ProjectileSpriteConfig
} from '../../projectiles/pool/projectilePool'
import { createProjectileSpawnSystem } from '../../projectiles/systems/spawnSystem'
import { createProjectileCollisionSystem } from '../../projectiles/systems/collisionSystem'
import { createDespawnSystem } from '../../projectiles/systems/despawnSystem'
import { Projectile } from '../../projectiles/components/Projectile'
import type { World } from 'bitecs'

// sound_attack_1.png: 104×26, 4 frames in a single row (26×26 each)
const SOUND_SPRITE: ProjectileSpriteConfig = {
  texture: '/sound_attack_1.png',
  columns: 4,
  rows: 1,
  width: 1.0,
  height: 1.0,
  fps: 8,
  startFrame: 0,
  endFrame: 3
}

// Base stats at level 1
const BASE_DAMAGE = 1
const BASE_SPEED = 25
const BASE_INTERVAL = 0.8

const UPGRADES: SkillDefinition['upgrades'] = [
  { level: 2, patch: { damage: 2, speed: 5 } },
  { level: 3, patch: { damage: 3, interval: -0.15 } },
  { level: 4, patch: { damage: 4, speed: 10 } },
  { level: 5, patch: { damage: 6, interval: -0.1, speed: 5 } }
]

type ProjectileStats = { damage: number; speed: number; interval: number }

function accumulateUpgrades(level: number): ProjectileStats {
  // eslint-disable-next-line functional/no-let
  let damage = BASE_DAMAGE
  // eslint-disable-next-line functional/no-let
  let speed = BASE_SPEED
  // eslint-disable-next-line functional/no-let
  let interval = BASE_INTERVAL

  for (const upg of UPGRADES) {
    if (upg.level > level) break
    if (upg.patch.damage) damage = BASE_DAMAGE + upg.patch.damage
    if (upg.patch.speed) speed = BASE_SPEED + upg.patch.speed
    if (upg.patch.interval)
      interval = Math.max(0.1, BASE_INTERVAL + upg.patch.interval)
  }

  return { damage, speed, interval }
}

function setupProjectileSystems(
  world: World,
  state: ProjectileStats,
  initialSpeed: number
) {
  const pool = createProjectilePool(world, 200, SOUND_SPRITE)
  const poolAcquire = pool.acquire.bind(pool)

  const acquire = (x: number, z: number, vx: number, vz: number): number => {
    const eid = poolAcquire(x, z, vx, vz)
    if (eid >= 0) Projectile.damage[eid] = state.damage
    return eid
  }

  const spawn = createProjectileSpawnSystem(world, acquire, initialSpeed)
  spawn.setInterval(state.interval)

  const collision = createProjectileCollisionSystem(
    world,
    (eid) => pool.release(eid),
    1
  )
  const despawn = createDespawnSystem(world, (eid) => pool.release(eid))

  return { spawn, collision, despawn }
}

function createProjectileSkill(
  world: World,
  _playerEid: number,
  level: number
) {
  const state: ProjectileStats = {
    damage: BASE_DAMAGE,
    speed: BASE_SPEED,
    interval: BASE_INTERVAL
  }

  const { spawn, collision, despawn } = setupProjectileSystems(
    world,
    state,
    BASE_SPEED
  )

  function applyLevel(lvl: number): void {
    const stats = accumulateUpgrades(lvl)
    state.damage = stats.damage
    state.speed = stats.speed
    state.interval = stats.interval
    spawn.setInterval(state.interval)
    spawn.setSpeed(state.speed)
  }

  applyLevel(level)

  return {
    update(dt: number) {
      spawn.update(dt)
      collision.update()
      despawn.update(dt)
    },
    destroy() {
      // ponytail: pool entities are just tagged inactive, no per-entity cleanup needed
    },
    setLevel(lvl: number) {
      applyLevel(lvl)
    }
  }
}

function getProjectileDetail(lvl: number): string {
  const stats = accumulateUpgrades(lvl)
  const lines = [
    `Fires a holy bolt at the nearest enemy.`,
    `Damage: ${stats.damage}`,
    `Speed: ${stats.speed}`,
    `Interval: ${stats.interval.toFixed(2)}s`
  ]
  const upg = UPGRADES.find((u) => u.level === lvl)
  if (upg) {
    const changes = Object.entries(upg.patch)
      .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`)
      .join('\n')
    lines.push(`\nAt Lv.${lvl}:`, changes)
  }
  return lines.join('\n')
}

registerSkill({
  id: SKILL_ID.PROJECTILE,
  name: 'Holy Bolt',
  icon: '🔵',
  description: 'Fires at nearest enemy',
  maxLevel: 5,
  upgrades: UPGRADES,
  create: createProjectileSkill,
  getDetail: getProjectileDetail
})
