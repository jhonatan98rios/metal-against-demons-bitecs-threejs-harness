# Typed Arrays

For fixed-size worlds or multithreading, use TypedArrays.

```JavaScript
// Pre-allocate TypedArrays for 10,000 entities
const Position = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
}

// Use Float32 for graphics, Float64 for physics precision
const Transform = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  rotation: new Float32Array(10000),
  scale: new Float32Array(10000),
}

// Integer types for flags/IDs
const Sprite = {
  textureId: new Uint16Array(10000),
  frame: new Uint8Array(10000),
  layer: new Int8Array(10000),
}
```

# SharedArrayBuffer for Multithreading

```JavaScript
// Allocate shared memory for worker threads
const MAX_ENTITIES = 10000
const sharedBuffer = new SharedArrayBuffer(MAX_ENTITIES * 8 * 2) // 2 Float64s

const Position = {
  x: new Float64Array(sharedBuffer, 0, MAX_ENTITIES),
  y: new Float64Array(sharedBuffer, MAX_ENTITIES * 8, MAX_ENTITIES),
}

// Pass sharedBuffer to workers - they can read/write Position directly
```
