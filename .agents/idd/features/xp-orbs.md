# Feature: XP Orbs on Enemy Death

> **Status**: `partial`

This file is the primary execution and maintenance contract for the feature.

## What

Replacing the immediate XP grant on enemy death with a pooled, ECS-driven
light-blue XP orb that enemies drop at their position; the orb is pulled toward
the player and grants its carried `Enemy.xpValue` XP when collected.

## Acceptance Criteria

- [x] **AC1**: `Orb` component exposes `isOrb` (u8) and `xpValue` (f32), in `src/game/core/orbs/components/Orb.ts`, backed by `sab` like every other component.
- [x] **AC2**: `createOrbPool(world, size)` pre-allocates orbs and provides `acquire(x, z, xpValue)`, `release(eid)`, and `releaseAll()`, mirroring `projectilePool`.
- [x] **AC3**: `createEnemyDeathSystem(world, release, spawnOrb)` acquires one orb at the dead enemy's `Position` carrying `Enemy.xpValue[eid]`, then releases the enemy; it no longer writes `XP.current` directly.
- [x] **AC4**: An orb magnet system moves every active orb toward the player at a fixed speed once the player is within `ORB.MAGNET_RADIUS` (XZ distance); orbs outside the radius stay idle.
- [x] **AC5**: An orb collect system adds `Orb.xpValue[eid]` to `XP.current[playerEid]` and releases the orb once the player is within `ORB.COLLECT_RADIUS` (XZ distance); `levelUpSystem` and `PlayerHUD` keep working unchanged.
- [x] **AC6**: Orbs render as a single light-blue sprite through the existing instanced-mesh path (one draw call, no per-entity `THREE.Mesh`), hidden while pooled/inactive.
- [x] **AC7**: Orb pool size is derived from the phase so active orbs can never exhaust the pool (max concurrent orbs = total enemies), i.e. no XP is lost to a failed `acquire`.
- [x] **AC8**: Restart calls `releaseAll()` on the orb pool so no leftover orb from the previous run can grant XP after the reset.
- [ ] **AC9**: One colocated vitest covers the magnet step and the XP grant on collection; `pnpm validate:full` reports no errors. _(Test written at `src/game/core/orbs/orbSystems.test.ts`; `lint`, `typecheck`, and `depcruise` pass. `vitest` and `knip` crash with SIGILL in this environment, so the suite was verified with a `tsx` + `assert` reproduction instead.)_

## Details

### Constraints

- Mirrors the `src/game/core/projectiles/` layout: `components/`, `pool/`, `systems/`, plus `definitions/orb.ts` for tunables and the sprite config.
- Zero new dependencies. One new static asset: `public/orbs/xp_orb.png` (64×64 light-blue glowing sphere, single frame).
- Orb material uses additive blending with `depthWrite: false` so the soft glow reads as a magic sphere; the instanced shader discards only near-zero alpha so the halo is preserved.
- Orbs must NOT carry the `Animation` (or `AnimationRow`) component: the sprite is single-frame, and more importantly `createWorkerPool` removes every `Animation` entity whose `Health.current <= 0`, and orbs have no `Health`. This keeps orbs out of the worker animation query entirely.
- Orb components are minimal: `Active`, `Orb`, `Position`, `Renderable`, `Sprite`. No `Velocity`: the magnet system integrates position directly (orbs are outside the worker movement query, so a velocity would never be applied).
- All distance math is XZ-only, consistent with projectile collision.
- ECS code (`core/`) must not import rendering; rendering may import the `Orb` component.
- No TTL on orbs: they persist until collected, so the pool bound is the total enemy count of the phase.

### Out of Scope

- Magnet/pickup radius upgrades, the `luck` attribute, orb XP multipliers, or skill-driven pickup.
- Orb tiers (small/large/value classes), bobbing/pulse animation, sounds, floating "+XP" popups.
- Auto-vacuum of leftover orbs on victory.
- Fixing the pre-existing worker-pool quirk described under Risks.

### Implementation Plan

1. Add `Orb` component and `orbDefinitions` (texture, sprite size, magnet radius, collect radius, magnet speed, hover Y).
2. Add `createOrbPool` reusing the `Active`/`Inactive` acquire/release pattern.
3. Add `createOrbMagnetSystem` (idle vs. pull toward `world.playerEid`) and `createOrbCollectSystem` (grant XP and release).
4. Change `createEnemyDeathSystem` to spawn an orb instead of granting XP; drop its `XP` import.
5. Route orbs through the instanced-mesh branch in `createRenderSystem` (new ORB slot, `Orb.isOrb` check, capacity guard) and add the orb entry to `SPRITE_Y_OFFSET`.
6. Wire the pool and systems in `main.ts`: create the pool in `start()`, pass `acquire` into the death system, add both orb systems to `tickGameplay`, and call `releaseAll()` in `makeRestartCallback`.
7. Add the colocated test and run `pnpm validate:full`.

---

## Dependencies

### Feature Dependencies

- `Active` / `Inactive` shared components (enemy pooling).
- `Position`, `Velocity`, `Renderable`, `Sprite` shared components.
- `XP` shared component and `createLevelUpSystem` (XP now arrives via collection).
- `Enemy.xpValue` (already set per enemy definition).
- `createEnemyDeathSystem` (behavior change) and `createGameStateSystem` restart callback.
- `createEnemyIM` instanced-mesh renderer and `createRenderSystem` routing.

### External Dependencies

- None.

---

## Technical Considerations

### Performance

- Pool: O(1) acquire/release via free list, same as projectiles.
- Magnet + collect: one O(active orbs) pass per frame; skip via `Not(Inactive)`.
- Rendering: one ORB InstancedMesh slot (plus its shadow) — no per-orb meshes or materials.
- Pool bound: `phase.enemyCount` orbs pre-allocated, matching the maximum possible concurrent drops.

### Security

- Not applicable.

### Backward Compatibility

- XP still reaches the player, only after pick-up instead of on kill.
- `createEnemyDeathSystem` signature changes; its only callers live in `main.ts`.
- `Enemy.xpValue` keeps its meaning (now the orb's payload).
- New component and pool are additive; no existing query is affected.

### Risks / Open Questions

- **Worker-pool quirk (pre-existing)**: `collectRemoveQueue` / `game.worker.ts#collectRemoves` remove any entity that matches the animation query and has `Health.current <= 0`. Projectile entities (Animation, no Health) are caught by this; orbs avoid it by omitting `Animation`. Worth a separate ticket to filter the worker query by `Enemy`.
- Instanced-mesh capacity is a hardcoded `ENEMY_CAPACITY = 5000`; the render loop must guard `slot.counter` so a phase growing past it degrades instead of throwing.
- Should leftover orbs expire after N seconds? Decided no for now (pool is bounded); revisit if visual clutter becomes an issue.

---

## API Contract (if applicable)

```text
// Component
Orb.isOrb[eid]   = 0 | 1
Orb.xpValue[eid] = f32

// Pool
function createOrbPool(world: World, size: number): {
  acquire(x: number, z: number, xpValue: number): number  // -1 if exhausted
  release(eid: number): void
  releaseAll(): void
}

// Systems
function createOrbMagnetSystem(world: World): { update(dt: number): void }
function createOrbCollectSystem(world: World, release: (eid: number) => void): { update(): void }

// Changed signature
function createEnemyDeathSystem(
  world: World,
  release: (eid: number) => void,
  spawnOrb: (x: number, z: number, xpValue: number) => void
): { update(): void }
```

---

## Glossary

Use glossary anchors to reconnect later maintenance work to the source code that implements this feature.

| Location                                       | Type  | Description                                                                          |
| ---------------------------------------------- | ----- | ------------------------------------------------------------------------------------ |
| `src/game/core/orbs/components/Orb.ts`         | file  | New `Orb` component (`isOrb`, `xpValue`).                                            |
| `src/game/core/orbs/definitions/orb.ts`        | file  | Orb tunables: texture, size, magnet radius, collect radius, magnet speed, hover Y.   |
| `src/game/core/orbs/pool/orbPool.ts`           | file  | `createOrbPool()` with free list and `releaseAll()`.                                 |
| `src/game/core/orbs/systems/magnetSystem.ts`   | file  | Pulls active orbs toward the player inside magnet radius.                            |
| `src/game/core/orbs/systems/collectSystem.ts`  | file  | Grants `Orb.xpValue` to `XP.current` and releases the orb.                           |
| `src/game/core/orbs/orbSystems.test.ts`        | file  | Vitest for magnet step and XP grant.                                                 |
| `src/game/core/enemies/systems/deathSystem.ts` | file  | Modified: spawn orb instead of direct XP grant.                                      |
| `src/game/rendering/createRenderSystem.ts`     | file  | Modified: ORB instanced slot, routing, Y offset, capacity guard.                     |
| `src/game/main.ts`                             | file  | Modified: orb pool wiring, orb systems in `tickGameplay`, `releaseAll()` on restart. |
| `public/orbs/xp_orb.png`                       | asset | Light-blue single-frame orb sprite.                                                  |
