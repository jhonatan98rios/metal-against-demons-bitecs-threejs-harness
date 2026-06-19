# Learned Rules

## Summary

This is a BitECS + Three.js game project using Next.js as the app shell. The game engine lives under `src/game/` with strict separation: core (ECS components, player entity, bootstrap), gameplay (input, character controller), rendering (sprite rendering, animation system), and scenarios (level geometry).

## Rules

| Rule Type    | Scope                        | Constraint                                                                                                                                                         | Rationale                                                                 | Status    |
| ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | --------- |
| Architecture | `createPlayer()`             | Must add all components (Player, Health, Position, Velocity, Renderable, Sprite, Animation, AnimationRow)                                                          | Every component has setup logic that depends on the entity existing first | confirmed |
| Architecture | `src/game/`                  | 4-layer separation: core/ (components, entities, bootstrap), gameplay/ (input, controllers), rendering/ (systems that touch THREE.js), scenarios/ (level geometry) | Keeps ECS pure from rendering, gameplay decoupled from initialization     | confirmed |
| Architecture | `Sprite` component           | Always set `columns`, `rows`, `width`, `height` when creating a sprite entity                                                                                      | Render system reads these for UV offset and sprite scale                  | confirmed |
| Architecture | `Animation` component        | Always set `startFrame`, `endFrame`, `fps` when creating an animated entity                                                                                        | Animation system loops `currentFrame` between start/end at the given FPS  | confirmed |
| BitECS       | Component definition         | Use array-based store: `{ field: [] as number[] }`                                                                                                                 | BitECS schema-less components use parallel arrays for AoS->SoA            | confirmed |
| BitECS       | Entity creation              | `addEntity(world)` then `addComponent(world, eid, component)` for each component                                                                                   | Components must be added before setting values                            | confirmed |
| BitECS       | Systems                      | Use `query(world, [ComponentA, ComponentB])` to iterate entities                                                                                                   | Standard BitECS pattern for system queries                                | confirmed |
| Gameplay     | Player row animation         | Row mapping: 0=idle L, 1=walk L, 2=idle R, 3=walk R                                                                                                                | Spritesheet layout constraint                                             | confirmed |
| Gameplay     | Character controller         | Must call `setAnimationRowFromAxis()` before `movePlayer()` on each update                                                                                         | Animation row reflects current frame's input direction                    | confirmed |
| Gameplay     | Idle row reset               | When axis is zero (player stopped), switch walk→idle row (1→0, 3→2)                                                                                                | Prevents walk animation playing while standing still                      | confirmed |
| Rendering    | `updateSpriteFrame` fallback | `AnimationRow.row[eid] ?? Math.floor(currentFrame / columns)`                                                                                                      | Entities without AnimationRow component should render correctly           | confirmed |
| Rendering    | Sprite material              | Use `NearestFilter`, `SRGBColorSpace`, `transparent: true`, `alphaTest: 0.5`, `depthWrite: false`                                                                  | Pixel-art rendering quality with proper transparency                      | confirmed |
| Tooling      | Complexity limit             | Per-function complexity ≤ 8 (lizard rule)                                                                                                                          | Enforced by `pnpm validate:full`                                          | confirmed |
| Tooling      | Validation                   | Always run `pnpm validate:full` after code changes                                                                                                                 | Runs lint, typecheck, depcruise, knip, complexity, format check           | confirmed |
| Tooling      | Circular deps                | No circular imports between layers                                                                                                                                 | Enforced by dependency-cruiser                                            | confirmed |

## Notes

- Add or change rules only with explicit user approval unless the user directly asks to save the rule.

### Layer import boundaries

```
gameplay/  →  core/       (controllers import Position, Velocity, AnimationRow)
rendering/ →  core/       (systems import Animation, Sprite, Position, Renderable)
scenarios/ →  (standalone, only imports from Three.js or its own world/ sub-modules)
core/      →  (standalone, only imports from bitecs)
```

No layer may import from another layer at the same or higher level. `main.ts` orchestrates all layers.

### Key ECS components overview

| Component      | Fields                                           | Purpose                                    |
| -------------- | ------------------------------------------------ | ------------------------------------------ |
| `Position`     | x, y, z                                          | 3D world position                          |
| `Velocity`     | x, z                                             | Movement direction (reset to 0 each frame) |
| `Health`       | current, max                                     | HP tracking                                |
| `Renderable`   | isRenderable (0/1)                               | Render eligibility flag                    |
| `Sprite`       | name, texture, columns, rows, width, height      | Spritesheet metadata                       |
| `Animation`    | currentFrame, elapsed, fps, startFrame, endFrame | Frame cycling state                        |
| `AnimationRow` | row (0-3)                                        | Active spritesheet row                     |

### Entity creation pattern

1. `addEntity(world)` → get eid
2. `addComponent(world, eid, component)` for each component
3. Set component values: `Component.field[eid] = value`
4. Return eid

### Feature IDD convention

- All features under `.agents/idd/features/` following `_template.md`.
- Status: `draft` | `in-progress` | `partial` | `complete`.
- Every feature has a glossary mapping locations to types (file, module, function, component).
- ACs use `[x]` for complete, `[ ]` for pending.
