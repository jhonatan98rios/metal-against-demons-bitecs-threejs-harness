import { addComponent, addEntity, query, removeEntity, World } from 'bitecs'

import { Spawner } from '../components/Spawner'
import { setupApparition, setupCrawler } from '../entity'

interface EnemyPoolHandle {
  acquire: () => number
}

interface SpawnPoolConfig {
  pool: EnemyPoolHandle
  interval: number
  total: number
}

// ponytail: single spawn box + 50/50 type split, same as the old bulk spawner
const placeEnemy = (eid: number) => {
  if (Math.random() > 0.5) {
    setupApparition(
      eid,
      -300 + Math.random() * 600,
      -240 + Math.random() * 480,
      Math.random() > 0.5
    )
  } else {
    setupCrawler(
      eid,
      -300 + Math.random() * 600,
      -240 + Math.random() * 480,
      Math.random() > 0.5
    )
  }
}

const updateSpawners = (
  world: World,
  handles: EnemyPoolHandle[],
  dt: number
) => {
  const spawners = query(world, [Spawner])
  const done: number[] = []

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < spawners.length; i++) {
    const eid = spawners[i]
    const interval = Spawner.interval[eid]

    // ponytail: cap accumulation so a pause/resume never bursts spawns
    Spawner.accumulator[eid] = Math.min(Spawner.accumulator[eid] + dt, interval)

    while (
      Spawner.accumulator[eid] >= interval &&
      Spawner.spawned[eid] < Spawner.total[eid]
    ) {
      const acquired = handles[Spawner.poolIndex[eid]].acquire()

      // ponytail: pool exhausted — backpressure, retry next frame
      if (acquired === -1) break

      placeEnemy(acquired)
      Spawner.spawned[eid] += 1
      Spawner.accumulator[eid] -= interval
    }

    if (Spawner.spawned[eid] >= Spawner.total[eid]) {
      done.push(eid)
    }
  }

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < done.length; i++) {
    // ponytail: remove after iterating — mutating the query mid-loop is unsafe
    removeEntity(world, done[i])
  }
}

export function createEnemySpawnSystem(world: World, pools: SpawnPoolConfig[]) {
  const handles: EnemyPoolHandle[] = []

  pools.forEach((config, index) => {
    const eid = addEntity(world)
    addComponent(world, eid, Spawner)
    Spawner.interval[eid] = config.interval
    Spawner.accumulator[eid] = 0
    Spawner.spawned[eid] = 0
    Spawner.total[eid] = config.total
    Spawner.poolIndex[eid] = index
    handles.push(config.pool)
  })

  return {
    update(dt: number) {
      updateSpawners(world, handles, dt)
    }
  }
}
