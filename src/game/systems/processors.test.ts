/**
 * Tests for pure ECS processing functions (processors.ts).
 *
 * All tests operate on plain typed arrays — no World, no Worker, no SAB required.
 */
import { describe, it, expect } from 'vitest'
import {
  updateAnimations,
  updateMovement,
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

describe('processPartition > full', () => {
  it('runs animation and movement, leaving lifecycle alone', () => {
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

    processPartition({
      entities,
      dt: 0.05,
      active: { isActive: new Uint8Array([1]) },
      animation: anim,
      position,
      velocity
    })

    expect(anim.elapsed[0]).toBeCloseTo(0.05)
    expect(position.x[0]).toBeCloseTo(0.5)
    expect(position.z[0]).toBeCloseTo(0.25)
  })
})

describe('processPartition > nulls', () => {
  it('handles null animation, position, velocity', () => {
    const entities = makeEntities(1)

    processPartition({
      entities,
      dt: 0.5,
      active: { isActive: new Uint8Array([1]) },
      animation: null,
      position: null,
      velocity: null
    })

    expect(entities.length).toBe(1)
  })
})
