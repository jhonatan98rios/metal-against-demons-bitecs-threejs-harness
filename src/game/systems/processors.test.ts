/**
 * Tests for pure ECS processing functions (processors.ts).
 *
 * All tests operate on plain typed arrays — no World, no Worker, no SAB required.
 */
import { describe, it, expect } from 'vitest'
import {
  updateAnimations,
  updateMovement,
  collectRemoveQueue,
  collectMoveQueue,
  processPartition
} from './processors'

function makeEntities(count: number): Uint32Array {
  return new Uint32Array(Array.from({ length: count }, (_, i) => i))
}

describe('updateAnimations > elapsed', () => {
  it('advances elapsed by dt', () => {
    const entities = makeEntities(2)
    const anim = {
      currentFrame: new Uint16Array([0, 0]),
      elapsed: new Float32Array([0, 0]),
      fps: new Float32Array([10, 10]),
      startFrame: new Uint16Array([0, 0]),
      endFrame: new Uint16Array([3, 3])
    }

    updateAnimations({
      entities,
      active: { isActive: new Uint8Array([1, 1]) },
      animation: anim,
      dt: 0.05
    })

    expect(anim.elapsed[0]).toBeCloseTo(0.05)
    expect(anim.currentFrame[0]).toBe(0)
  })
})

describe('updateAnimations > frame cycle', () => {
  it('cycles frame when elapsed passes frame duration', () => {
    const entities = makeEntities(1)
    const anim = {
      currentFrame: new Uint16Array([0]),
      elapsed: new Float32Array([0]),
      fps: new Float32Array([4]),
      startFrame: new Uint16Array([0]),
      endFrame: new Uint16Array([3])
    }

    updateAnimations({
      entities,
      active: { isActive: new Uint8Array([1]) },
      animation: anim,
      dt: 0.3
    })

    expect(anim.currentFrame[0]).toBe(1)
    expect(anim.elapsed[0]).toBeCloseTo(0)
  })
})

describe('updateAnimations > wrap', () => {
  it('wraps around at endFrame', () => {
    const entities = makeEntities(1)
    const anim = {
      currentFrame: new Uint16Array([3]),
      elapsed: new Float32Array([0]),
      fps: new Float32Array([4]),
      startFrame: new Uint16Array([0]),
      endFrame: new Uint16Array([3])
    }

    updateAnimations({
      entities,
      active: { isActive: new Uint8Array([1]) },
      animation: anim,
      dt: 0.3
    })

    expect(anim.currentFrame[0]).toBe(0)
  })
})

describe('updateAnimations > inactive', () => {
  it('skips inactive entities', () => {
    const entities = makeEntities(2)
    const anim = {
      currentFrame: new Uint16Array([0, 0]),
      elapsed: new Float32Array([0, 0]),
      fps: new Float32Array([10, 10]),
      startFrame: new Uint16Array([0, 0]),
      endFrame: new Uint16Array([3, 3])
    }

    updateAnimations({
      entities,
      active: { isActive: new Uint8Array([0, 1]) },
      animation: anim,
      dt: 0.05
    })

    expect(anim.elapsed[0]).toBe(0)
    expect(anim.elapsed[1]).toBeCloseTo(0.05)
  })
})

describe('updateMovement > integration', () => {
  it('integrates velocity into position', () => {
    const entities = makeEntities(2)
    const position = {
      x: new Float32Array([0, 10]),
      y: new Float32Array([0, 0]),
      z: new Float32Array([0, 5])
    }
    const velocity = {
      x: new Float32Array([10, 0]),
      z: new Float32Array([5, -2])
    }

    updateMovement({
      entities,
      active: { isActive: new Uint8Array([1, 1]) },
      position,
      velocity,
      dt: 0.5
    })

    expect(position.x[0]).toBeCloseTo(5)
    expect(position.z[0]).toBeCloseTo(2.5)
    expect(position.x[1]).toBeCloseTo(10)
    expect(position.z[1]).toBeCloseTo(4)
  })
})

describe('updateMovement > inactive', () => {
  it('skips inactive entities', () => {
    const entities = makeEntities(2)
    const position = {
      x: new Float32Array([0, 0]),
      y: new Float32Array([0, 0]),
      z: new Float32Array([0, 0])
    }
    const velocity = {
      x: new Float32Array([10, 10]),
      z: new Float32Array([5, 5])
    }

    updateMovement({
      entities,
      active: { isActive: new Uint8Array([0, 1]) },
      position,
      velocity,
      dt: 1
    })

    expect(position.x[0]).toBe(0)
    expect(position.x[1]).toBeCloseTo(10)
  })
})

describe('updateMovement > zero', () => {
  it('handles zero velocity', () => {
    const entities = makeEntities(1)
    const position = {
      x: new Float32Array([42]),
      y: new Float32Array([0]),
      z: new Float32Array([99])
    }
    const velocity = {
      x: new Float32Array([0]),
      z: new Float32Array([0])
    }

    updateMovement({
      entities,
      active: { isActive: new Uint8Array([1]) },
      position,
      velocity,
      dt: 1
    })

    expect(position.x[0]).toBeCloseTo(42)
    expect(position.z[0]).toBeCloseTo(99)
  })
})

describe('collectRemoveQueue > health', () => {
  it('collects entity IDs where health.current <= 0', () => {
    const entities = makeEntities(4)
    const out: number[] = []

    collectRemoveQueue({
      entities,
      active: { isActive: new Uint8Array([1, 1, 1, 1]) },
      health: { current: new Float32Array([10, 0, -1, 5]) },
      out
    })

    expect(out).toEqual([1, 2])
  })
})

describe('collectRemoveQueue > inactive', () => {
  it('skips inactive entities even if health <= 0', () => {
    const entities = makeEntities(3)
    const out: number[] = []

    collectRemoveQueue({
      entities,
      active: { isActive: new Uint8Array([0, 1, 0]) },
      health: { current: new Float32Array([0, 0, 0]) },
      out
    })

    expect(out).toEqual([1])
  })
})

describe('collectRemoveQueue > null', () => {
  it('does nothing when health is null', () => {
    const entities = makeEntities(2)
    const out: number[] = []

    collectRemoveQueue({
      entities,
      active: { isActive: new Uint8Array([1, 1]) },
      health: null,
      out
    })

    expect(out).toEqual([])
  })
})

describe('collectMoveQueue > basic', () => {
  it('collects flat [eid, x, z] for active entities', () => {
    const entities = makeEntities(2)
    const out: number[] = []

    collectMoveQueue({
      entities,
      active: { isActive: new Uint8Array([1, 1]) },
      position: {
        x: new Float32Array([10, 20]),
        y: new Float32Array([0, 0]),
        z: new Float32Array([5, 15])
      },
      out
    })

    expect(out).toEqual([0, 10, 5, 1, 20, 15])
  })
})

describe('collectMoveQueue > inactive', () => {
  it('skips inactive entities', () => {
    const entities = makeEntities(3)
    const out: number[] = []

    collectMoveQueue({
      entities,
      active: { isActive: new Uint8Array([0, 1, 1]) },
      position: {
        x: new Float32Array([1, 2, 3]),
        y: new Float32Array([0, 0, 0]),
        z: new Float32Array([4, 5, 6])
      },
      out
    })

    expect(out).toEqual([1, 2, 5, 2, 3, 6])
  })
})

describe('processPartition > full', () => {
  it('runs animation, movement, and queues', () => {
    const entities = makeEntities(1)
    const anim = {
      currentFrame: new Uint16Array([0]),
      elapsed: new Float32Array([0]),
      fps: new Float32Array([10]),
      startFrame: new Uint16Array([0]),
      endFrame: new Uint16Array([3])
    }
    const position = {
      x: new Float32Array([0]),
      y: new Float32Array([0]),
      z: new Float32Array([0])
    }
    const velocity = {
      x: new Float32Array([10]),
      z: new Float32Array([5])
    }
    const removeAcc: number[] = []
    const moveAcc: number[] = []
    processPartition({
      entities,
      dt: 0.05,
      active: { isActive: new Uint8Array([1]) },
      animation: anim,
      position,
      velocity,
      health: { current: new Float32Array([100]) },
      removeQueue: removeAcc,
      moveQueue: moveAcc
    })

    expect(anim.elapsed[0]).toBeCloseTo(0.05)
    expect(position.x[0]).toBeCloseTo(0.5)
    expect(position.z[0]).toBeCloseTo(0.25)
    expect(removeAcc).toEqual([])
    expect(moveAcc).toEqual([0, 0.5, 0.25])
  })
})
describe('processPartition > nulls', () => {
  it('handles null animation, position, velocity, health', () => {
    const entities = makeEntities(1)

    const removeAcc: number[] = []
    const moveAcc: number[] = []

    processPartition({
      entities,
      dt: 0.5,
      active: { isActive: new Uint8Array([1]) },
      animation: null,
      position: null,
      velocity: null,
      health: null,
      removeQueue: removeAcc,
      moveQueue: moveAcc
    })

    expect(removeAcc).toEqual([])
    expect(moveAcc).toEqual([])
  })
})
