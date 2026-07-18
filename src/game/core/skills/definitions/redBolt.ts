import { addComponent, addEntity, Not, query, removeComponent, World } from 'bitecs'

import { registerSkill } from '../registry'
import { SKILL_ID } from '../skillIds'
import type { SkillDefinition } from '../types'
import { Active } from '../../shared/components/Active'
import { Animation } from '../../shared/components/Animation'
import { Billboard } from '../../shared/components/Billboard'
import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'
import { Renderable } from '../../shared/components/Renderable'
import { Sprite } from '../../shared/components/Sprite'
import { TTL } from '../../shared/components/TTL'
import { Projectile } from '../../projectiles/components/Projectile'
import { Spiral } from '../../projectiles/components/Spiral'
import { getCollisionSystem } from '../../projectiles/systems/collisionSystem'
import { createDespawnSystem } from '../../projectiles/systems/despawnSystem'
import type { ProjectileSpriteConfig } from '../../projectiles/pool/projectilePool'

// bat_attack_1.png: 96×48, 2 frames in a single row (48×48 each)
const BAT_SPRITE: ProjectileSpriteConfig = {
  texture: '/bat_attack_1.png',
  columns: 2,
  rows: 1,
  width: 2.0,
  height: 2.0,
  fps: 8,
  startFrame: 0,
  endFrame: 1
}

// ── Spiral projectile pool ──────────────────────────────────────────────

const POOL_COMPONENTS = [
  Active,
  Projectile,
  Position,
  Renderable,
  Sprite,
  Animation,
  TTL,
  Billboard,
  Spiral
] as const

// ── pool lifecycle helpers (module-level to stay under line limits) ─────

function deactivatePoolEntity(world: World, eid: number): void {
  Active.isActive[eid] = 0
  addComponent(world, eid, Inactive)
}

function activatePoolEntity(world: World, eid: number): void {
  Active.isActive[eid] = 1
  removeComponent(world, eid, Inactive)
}

function createSpiralPool(
  world: World,
  size: number,
  sprite: ProjectileSpriteConfig
) {
  const free: number[] = []
  const add = (eid: number) =>
    POOL_COMPONENTS.forEach((c) => addComponent(world, eid, c))

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < size; i++) {
    const eid = addEntity(world)
    add(eid)

    deactivatePoolEntity(world, eid)
    Projectile.isProjectile[eid] = 1
    Projectile.damage[eid] = 1
    Projectile.poolId[eid] = 2
    Projectile.friendlyFire[eid] = 0
    Renderable.isRenderable[eid] = 1
    Billboard.isBillboard[eid] = 1
    Sprite.texture[eid] = sprite.texture
    Sprite.columns[eid] = sprite.columns
    Sprite.rows[eid] = sprite.rows
    Sprite.width[eid] = sprite.width
    Sprite.height[eid] = sprite.height
    Animation.currentFrame[eid] = sprite.startFrame
    Animation.elapsed[eid] = 0
    Animation.fps[eid] = sprite.fps
    Animation.startFrame[eid] = sprite.startFrame
    Animation.endFrame[eid] = sprite.endFrame
    TTL.remaining[eid] = 0

    free.push(eid)
  }

  return {
    acquire(x: number, z: number, ttl: number) {
      const eid = free.pop()
      if (eid === undefined) return -1
      activatePoolEntity(world, eid)
      Position.x[eid] = x
      Position.y[eid] = 4
      Position.z[eid] = z
      TTL.remaining[eid] = ttl
      Spiral.angle[eid] = Math.random() * Math.PI * 2
      return eid
    },
    release(eid: number) {
      deactivatePoolEntity(world, eid)
      free.push(eid)
    }
  }
}

// ── Spawn system ────────────────────────────────────────────────────────

function createSpiralSpawnSystem(
  world: World,
  pool: ReturnType<typeof createSpiralPool>,
  ttl: number
) {
  // eslint-disable-next-line functional/no-let
  let accumS = 0
  // eslint-disable-next-line functional/no-let
  let intervalS = 0.15

  return {
    setInterval(sec: number) {
      intervalS = sec
    },
    update(dt: number) {
      accumS = Math.min(accumS + dt, intervalS)
      if (accumS < intervalS) return
      accumS -= intervalS

      const playerEid = (world as { playerEid?: number }).playerEid
      if (playerEid === undefined) return

      pool.acquire(Position.x[playerEid], Position.z[playerEid], ttl)
    }
  }
}

// ── Spiral movement system ──────────────────────────────────────────────

const SPIRAL_QUERY = [Position, Spiral, Not(Inactive)]

function createSpiralMovementSystem(world: World) {
  return {
    update(dt: number) {
      const playerEid = (world as { playerEid?: number }).playerEid
      if (playerEid === undefined) return

      const pX = Position.x[playerEid]
      const pZ = Position.z[playerEid]

      const ents = query(world, SPIRAL_QUERY)
      for (const eid of ents) {
        Spiral.angle[eid] -= Spiral.angularSpeed[eid] * dt
        const r =
          Math.sqrt((Position.x[eid] - pX) ** 2 + (Position.z[eid] - pZ) ** 2) +
          Spiral.radialSpeed[eid] * dt

        Position.x[eid] = pX + Math.cos(Spiral.angle[eid]) * r
        Position.z[eid] = pZ + Math.sin(Spiral.angle[eid]) * r
      }
    }
  }
}

// ── Skill definition ────────────────────────────────────────────────────

const BASE_DAMAGE = 1
const BASE_ANGULAR_SPEED = 5
const BASE_RADIAL_SPEED = 3
const BASE_INTERVAL = 1.5
const PROJECTILE_TTL = 3

const UPGRADES: SkillDefinition['upgrades'] = [
  { level: 2, patch: { damage: 2, radialSpeed: 1 } },
  { level: 3, patch: { damage: 3, interval: -0.03 } },
  { level: 4, patch: { damage: 4, radialSpeed: 2 } },
  { level: 5, patch: { damage: 6, angularSpeed: 2, interval: -0.03 } }
]

type SpiralStats = {
  damage: number
  angularSpeed: number
  radialSpeed: number
  interval: number
}

function accumulateUpgrades(level: number): SpiralStats {
  // eslint-disable-next-line functional/no-let
  let damage = BASE_DAMAGE
  // eslint-disable-next-line functional/no-let
  let angularSpeed = BASE_ANGULAR_SPEED
  // eslint-disable-next-line functional/no-let
  let radialSpeed = BASE_RADIAL_SPEED
  // eslint-disable-next-line functional/no-let
  let interval = BASE_INTERVAL

  for (const upg of UPGRADES) {
    if (upg.level > level) break
    if (upg.patch.damage) damage = BASE_DAMAGE + upg.patch.damage
    if (upg.patch.angularSpeed)
      angularSpeed = BASE_ANGULAR_SPEED + upg.patch.angularSpeed
    if (upg.patch.radialSpeed)
      radialSpeed = BASE_RADIAL_SPEED + upg.patch.radialSpeed
    if (upg.patch.interval)
      interval = Math.max(0.05, BASE_INTERVAL + upg.patch.interval)
  }

  return { damage, angularSpeed, radialSpeed, interval }
}

function applyStatOverrides(world: World, stats: SpiralStats) {
  const ents = query(world, [Spiral, Not(Inactive)])
  for (const eid of ents) {
    Spiral.angularSpeed[eid] = stats.angularSpeed
    Spiral.radialSpeed[eid] = stats.radialSpeed
  }
}

function createRedBoltSkill(world: World, _playerEid: number, level: number) {
  const pool = createSpiralPool(world, 200, BAT_SPRITE)
  const spawn = createSpiralSpawnSystem(world, pool, PROJECTILE_TTL)
  const movement = createSpiralMovementSystem(world)
  getCollisionSystem(world).registerPool(2, (eid) => pool.release(eid))
  const despawn = createDespawnSystem(world, (eid) => pool.release(eid))

  // eslint-disable-next-line functional/no-let
  let currentStats = accumulateUpgrades(level)

  function applyLevel(lvl: number): void {
    currentStats = accumulateUpgrades(lvl)
    spawn.setInterval(currentStats.interval)
    applyStatOverrides(world, currentStats)
  }

  applyLevel(level)

  const origAcquire = pool.acquire.bind(pool)
  pool.acquire = (x: number, z: number, ttl: number): number => {
    const eid = origAcquire(x, z, ttl)
    if (eid >= 0) {
      Projectile.damage[eid] = currentStats.damage
      Spiral.angularSpeed[eid] = currentStats.angularSpeed
      Spiral.radialSpeed[eid] = currentStats.radialSpeed
    }
    return eid
  }

  return {
    update(dt: number) {
      spawn.update(dt)
      movement.update(dt)
      despawn.update(dt)
    },
    destroy() {},
    setLevel(lvl: number) {
      applyLevel(lvl)
    }
  }
}

function getRedBoltDetail(lvl: number): string {
  const stats = accumulateUpgrades(lvl)
  const lines = [
    `Fires crimson bolts that spiral outward from you.`,
    `Damage: ${stats.damage}`,
    `Angular: ${stats.angularSpeed} rad/s`,
    `Radius growth: ${stats.radialSpeed} u/s`,
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
  id: SKILL_ID.RED_BOLT,
  name: 'Crimson Spiral',
  icon: '🔴',
  description: 'Spiraling red bolts',
  maxLevel: 5,
  upgrades: UPGRADES,
  create: createRedBoltSkill,
  getDetail: getRedBoltDetail
})
