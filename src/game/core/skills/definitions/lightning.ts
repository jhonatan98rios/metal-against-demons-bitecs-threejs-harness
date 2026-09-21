import {
  addComponent,
  addEntity,
  Not,
  query,
  removeComponent,
  World
} from 'bitecs'

import { registerSkill } from '../registry'
import { SKILL_ID } from '../skillIds'
import type { SkillDefinition } from '../types'
import { Enemy } from '../../enemies/components/Enemy'
import { Active } from '../../shared/components/Active'
import { Animation } from '../../shared/components/Animation'
import { Billboard } from '../../shared/components/Billboard'
import { Glow } from '../../shared/components/Glow'
import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'
import { Renderable } from '../../shared/components/Renderable'
import { Sprite } from '../../shared/components/Sprite'
import { TTL } from '../../shared/components/TTL'
import { applyDamage } from '../../shared/damage'
import { createDespawnSystem } from '../../projectiles/systems/despawnSystem'
import { Projectile } from '../../projectiles/components/Projectile'
import type { ProjectileSpriteConfig } from '../../projectiles/pool/projectilePool'
import { loadPlayerState } from '../../player/meta'

// lightning_1.png: 1296×176, 8 frames in a single row (162×176 each)
const LIGHTNING_SPRITE: ProjectileSpriteConfig = {
  texture: '/lightning_1.png',
  columns: 8,
  rows: 1,
  width: 9,
  height: 9.75,
  fps: 8,
  startFrame: 0,
  endFrame: 7,
  glow: 255
}

// 8 frames at 8 fps = 1s of animation; the strike lives exactly that long.
const STRIKE_TTL = 1
const STRIKE_Y = 5
// Contact area: ground footprint the sprite covers (AABB half-extent).
const STRIKE_HALF = LIGHTNING_SPRITE.width / 2

// pool 1 = holy bolt, 2 = vampire horde, 3 = lightning strike
const POOL_ID = 3
const POOL_SIZE = 8

const POOL_COMPONENTS = [
  Active,
  Glow,
  Projectile,
  Position,
  Renderable,
  Sprite,
  Animation,
  TTL,
  Billboard
] as const

// ── pool lifecycle helpers ──────────────────────────────────────────────

function deactivatePoolEntity(world: World, eid: number): void {
  Active.isActive[eid] = 0
  addComponent(world, eid, Inactive)
}

function activatePoolEntity(world: World, eid: number): void {
  Active.isActive[eid] = 1
  removeComponent(world, eid, Inactive)
}

function initStrikeEntity(
  world: World,
  eid: number,
  sprite: ProjectileSpriteConfig
) {
  POOL_COMPONENTS.forEach((c) => addComponent(world, eid, c))
  deactivatePoolEntity(world, eid)
  Projectile.isProjectile[eid] = 1
  Projectile.poolId[eid] = POOL_ID
  Projectile.friendlyFire[eid] = 0
  Renderable.isRenderable[eid] = 1
  Billboard.isBillboard[eid] = 1
  Glow.intensity[eid] = sprite.glow
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
}

function createStrikePool(
  world: World,
  size: number,
  sprite: ProjectileSpriteConfig
) {
  const free: number[] = []

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < size; i++) {
    const eid = addEntity(world)
    initStrikeEntity(world, eid, sprite)
    free.push(eid)
  }

  return {
    acquire(x: number, z: number, ttl: number) {
      const eid = free.pop()
      if (eid === undefined) return -1
      activatePoolEntity(world, eid)
      Position.x[eid] = x
      Position.y[eid] = STRIKE_Y
      Position.z[eid] = z
      TTL.remaining[eid] = ttl
      Animation.currentFrame[eid] = sprite.startFrame
      Animation.elapsed[eid] = 0
      return eid
    },
    release(eid: number) {
      deactivatePoolEntity(world, eid)
      free.push(eid)
    }
  }
}

// ── targeting ───────────────────────────────────────────────────────────

type NearestEnemies = {
  first: number
  firstD2: number
  second: number
  secondD2: number
}

/**
 * Picks the second closest enemy inside `range`, falling back to the closest
 * one when only a single enemy is in range. Returns -1 when none are.
 */
function findStrikeTarget(
  world: World,
  x: number,
  z: number,
  range: number
): number {
  const rangeSq = range * range
  const enemies = query(world, [
    Enemy,
    Position,
    Not(Inactive)
  ]) as readonly number[]

  const initial: NearestEnemies = {
    first: -1,
    firstD2: rangeSq,
    second: -1,
    secondD2: rangeSq
  }

  const nearest = enemies.reduce<NearestEnemies>((acc, eid) => {
    const dx = Position.x[eid] - x
    const dz = Position.z[eid] - z
    const d2 = dx * dx + dz * dz
    if (d2 > rangeSq) return acc
    if (d2 < acc.firstD2) {
      return {
        first: eid,
        firstD2: d2,
        second: acc.first,
        secondD2: acc.firstD2
      }
    }
    if (d2 < acc.secondD2) return { ...acc, second: eid, secondD2: d2 }
    return acc
  }, initial)

  return nearest.second !== -1 ? nearest.second : nearest.first
}

// ── spawn system ────────────────────────────────────────────────────────

type LightningStats = { damage: number; interval: number; range: number }

/** Damages every enemy whose center falls inside the strike footprint. */
function damageStrikeArea(
  world: World,
  x: number,
  z: number,
  damage: number
): void {
  const enemies = query(world, [
    Enemy,
    Position,
    Not(Inactive)
  ]) as readonly number[]

  for (const eid of enemies) {
    // ponytail: AABB test, no sqrt — the bolt never moves horizontally
    if (Math.abs(Position.x[eid] - x) > STRIKE_HALF) continue
    if (Math.abs(Position.z[eid] - z) > STRIKE_HALF) continue
    applyDamage(eid, damage)
  }
}

function createStrikeSpawnSystem(
  world: World,
  pool: ReturnType<typeof createStrikePool>,
  stats: LightningStats
) {
  // eslint-disable-next-line functional/no-let
  let accumS = 0

  return {
    update(dt: number) {
      accumS = Math.min(accumS + dt, stats.interval)
      if (accumS < stats.interval) return
      accumS -= stats.interval

      const playerEid = (world as { playerEid?: number }).playerEid
      if (playerEid === undefined) return

      const px = Position.x[playerEid]
      const pz = Position.z[playerEid]
      const target = findStrikeTarget(world, px, pz, stats.range)
      if (target < 0) return

      const tx = Position.x[target]
      const tz = Position.z[target]
      const eid = pool.acquire(tx, tz, STRIKE_TTL)
      if (eid >= 0) damageStrikeArea(world, tx, tz, stats.damage)
    }
  }
}

// ── skill definition ────────────────────────────────────────────────────

const BASE_DAMAGE = 2
const BASE_INTERVAL = 2
const BASE_RANGE = 18

const UPGRADES: SkillDefinition['upgrades'] = [
  { level: 2, patch: { damage: 1 } },
  { level: 3, patch: { damage: 1.5, interval: -0.2 } },
  { level: 4, patch: { damage: 2, range: 4 } },
  { level: 5, patch: { damage: 3, interval: -0.4 } }
]

function accumulateUpgrades(level: number): LightningStats {
  // eslint-disable-next-line functional/no-let
  let damage = BASE_DAMAGE
  // eslint-disable-next-line functional/no-let
  let interval = BASE_INTERVAL
  // eslint-disable-next-line functional/no-let
  let range = BASE_RANGE

  for (const upg of UPGRADES) {
    if (upg.level > level) break
    if (upg.patch.damage) damage = BASE_DAMAGE + upg.patch.damage
    if (upg.patch.interval)
      interval = Math.max(0.4, BASE_INTERVAL + upg.patch.interval)
    if (upg.patch.range) range = BASE_RANGE + upg.patch.range
  }

  return { damage, interval, range }
}

function createLightningSkill(world: World, _playerEid: number, level: number) {
  const pool = createStrikePool(world, POOL_SIZE, LIGHTNING_SPRITE)
  // ponytail: attackRange is meta, fixed per run — read once at creation
  const rangeMult = loadPlayerState().attributes.attackRange
  const stats = accumulateUpgrades(level)
  stats.range *= rangeMult

  const spawn = createStrikeSpawnSystem(world, pool, stats)
  const despawn = createDespawnSystem(world, POOL_ID, (eid) =>
    pool.release(eid)
  )

  function applyLevel(lvl: number): void {
    const next = accumulateUpgrades(lvl)
    stats.damage = next.damage
    stats.interval = next.interval
    stats.range = next.range * rangeMult
  }

  applyLevel(level)

  return {
    update(dt: number) {
      spawn.update(dt)
      despawn.update(dt)
    },
    destroy() {
      // ponytail: pooled entities are tagged inactive, no per-entity cleanup needed
    },
    setLevel(lvl: number) {
      applyLevel(lvl)
    }
  }
}

function getLightningDetail(lvl: number): string {
  const stats = accumulateUpgrades(lvl)
  const lines = [
    `Calls a bolt down on the second nearest enemy, shocking all foes in its blast.`,
    `Damage: ${stats.damage}`,
    `Range: ${stats.range}`,
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
  id: SKILL_ID.LIGHTNING,
  name: 'Skyfall',
  icon: '/lightning_1.png',
  iconColumns: LIGHTNING_SPRITE.columns,
  description: 'Bolts the second nearest enemy, shocking the blast area',
  maxLevel: 5,
  upgrades: UPGRADES,
  create: createLightningSkill,
  getDetail: getLightningDetail
})
