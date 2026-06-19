# Feature: BitECS Sprite Rendering System

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Render sprites from a spritesheet texture via Three.js `THREE.Sprite` objects, positioned and animated per-frame by BitECS components.

## Acceptance Criteria

- [x] **AC1**: `Sprite` component defines texture path, columns, rows, frame width, frame height.
- [x] **AC2**: `createSpriteRender()` loads texture, sets up `SpriteMaterial` with nearest-neighbor filtering and per-frame UV offset.
- [x] **AC3**: `createRenderSystem()` queries `[Position, Renderable]` entities each frame.
- [x] **AC4**: `updateSpriteFrame()` computes UV offset from `Animation.currentFrame` + `Sprite` columns/rows.
- [x] **AC5**: `getOrCreateRenderObject()` lazily creates and caches `THREE.Sprite` objects per entity.
- [x] **AC6**: `syncPosition()` writes `Position` x/y/z to sprite position each frame.

## Details

### Constraints

- All sprites use the same `NearestFilter` pixel-art style.
- Render objects cached in a `Map<number, THREE.Sprite>` — one sprite per entity, no pooling.
- Material is `SpriteMaterial` with `transparent: true`, `alphaTest: 0.5`, `depthWrite: false`.

### Out of Scope

- No 3D models, no mesh renderer.
- No multiple sprite layers or sorting.
- No particle system.

---

## Dependencies

### Feature Dependencies

- BitECS `Position` component (`src/game/core/shared/components/Position.ts`).
- BitECS `Renderable` component (`src/game/core/shared/components/Renderable.ts`).
- BitECS `Animation` component (`src/game/core/shared/components/Animation.ts`).
- BitECS `Sprite` component (`src/game/core/shared/components/Sprite.ts`).
- Three.js `THREE.Sprite`, `THREE.SpriteMaterial`, `THREE.TextureLoader`.

### External Dependencies

- Three.js (peer dep).

---

## Technical Considerations

### Performance

- One draw call per sprite — acceptable for <100 sprites.
- No sprite batching or instancing.
- Render objects are never destroyed (cached forever).

### Security

- Not applicable.

### Backward Compatibility

- New components (e.g., `AnimationRow`) must fall back gracefully when absent.

---

## Glossary

| Location                                        | Type   | Description                                                                                |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| `src/game/core/shared/components/Sprite.ts`     | file   | Component: `name`, `texture`, `columns`, `rows`, `width`, `height`.                        |
| `src/game/core/shared/components/Renderable.ts` | file   | Tag component: `isRenderable: 0/1`.                                                        |
| `src/game/rendering/createSpriteRender.ts`      | module | Factory: loads texture, creates `THREE.Sprite` with UV-offset material.                    |
| `src/game/rendering/createRenderSystem.ts`      | module | System: queries entities, updates sprite UV + position each frame.                         |
| `src/game/rendering/createRender.ts`            | module | Factory: creates `WebGLRenderer`, `Scene`, `PerspectiveCamera` with fog and ambient light. |
