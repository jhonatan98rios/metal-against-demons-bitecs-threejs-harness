import { createWorld } from 'bitecs'
import { beforeEach, describe, expect, it } from 'vitest'

import { Active } from '../shared/components/Active'
import { Glow } from '../shared/components/Glow'
import { Position } from '../shared/components/Position'
import { XP } from '../shared/components/XP'
import { ORB } from './definitions/orb'
import { createOrbPool } from './pool/orbPool'
import { createOrbCollectSystem } from './systems/collectSystem'
import { createOrbMagnetSystem } from './systems/magnetSystem'

const PLAYER = 0

function setup() {
  const world = createWorld() as ReturnType<typeof createWorld> & {
    playerEid: number
  }
  world.playerEid = PLAYER
  Position.x[PLAYER] = 0
  Position.z[PLAYER] = 0
  XP.current[PLAYER] = 0

  const pool = createOrbPool(world, 4)
  return {
    world,
    pool,
    magnet: createOrbMagnetSystem(world),
    collect: createOrbCollectSystem(world, pool.release)
  }
}

describe('orb magnet system', () => {
  beforeEach(() => {
    XP.current[PLAYER] = 0
  })

  it('pulls an orb inside the magnet radius to the player', () => {
    const { pool, magnet } = setup()
    const eid = pool.acquire(5, 0, 10)

    magnet.update(1)

    expect(Position.x[eid]).toBeCloseTo(0)
    expect(Position.z[eid]).toBeCloseTo(0)
  })

  it('leaves an orb outside the magnet radius untouched', () => {
    const { pool, magnet } = setup()
    const eid = pool.acquire(ORB.MAGNET_RADIUS + 5, 0, 10)

    magnet.update(1)

    expect(Position.x[eid]).toBe(ORB.MAGNET_RADIUS + 5)
  })
})

describe('orb collect system', () => {
  beforeEach(() => {
    XP.current[PLAYER] = 0
  })

  it('grants XP and releases the orb on contact', () => {
    const { pool, collect } = setup()
    const eid = pool.acquire(0, 0, 10)

    collect.update()

    expect(XP.current[PLAYER]).toBe(10)
    expect(Active.isActive[eid]).toBe(0)
  })

  it('ignores orbs outside the collect radius', () => {
    const { pool, collect } = setup()
    const eid = pool.acquire(ORB.COLLECT_RADIUS + 1, 0, 10)

    collect.update()

    expect(XP.current[PLAYER]).toBe(0)
    expect(Active.isActive[eid]).toBe(1)
  })
})

describe('orb glow', () => {
  it('scales emissive intensity with xp value', () => {
    const { pool } = setup()
    const weak = pool.acquire(0, 0, 7)
    const strong = pool.acquire(0, 0, 10)

    expect(Glow.intensity[weak]).toBe(ORB.GLOW_BASE + 7 * ORB.GLOW_PER_XP)
    expect(Glow.intensity[strong]).toBeGreaterThan(Glow.intensity[weak])
    expect(Glow.intensity[strong]).toBeLessThanOrEqual(255)
  })
})

describe('orb pool', () => {
  it('releaseAll frees every active orb for reuse', () => {
    const { pool } = setup()
    pool.acquire(1, 1, 10)
    pool.acquire(2, 2, 10)

    pool.releaseAll()

    const reacquired = [0, 1, 2, 3].map(() => pool.acquire(0, 0, 1))
    expect(new Set(reacquired).size).toBe(4)
    expect(reacquired).not.toContain(-1)
  })
})
