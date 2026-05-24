# Conventions

## Summary

The repo uses a minimal Next.js App Router scaffold with TypeScript, Tailwind
CSS v4, and strict local quality tooling. Formatting is Prettier-driven,
linting is typed ESLint with additional functional and boundary rules, and the
current source tree is intentionally small.

## Languages And Tooling

| Area | Choice | Notes |
|------|--------|-------|
| Languages | TypeScript, TSX, CSS, JSON, MJS | App code is TypeScript-first; configs use ESM where practical. |
| Package Managers | pnpm primary; bun lockfile also present | `package.json` scripts are written for `pnpm`, but `bun.lock` exists too, so the canonical manager is not fully settled. |
| Frameworks | Next.js 16.2.6, React 19.2.4, Tailwind CSS 4 | App Router lives under `app/`. |
| Linters And Formatters | ESLint 9, Prettier 3 | `eslint.config.mjs` uses typed rules; Prettier config is embedded in `package.json`. |
| Test Tooling | Vitest 4 | Config exists, but no tests are present yet. |

## Formatting

- Indentation: 2 spaces.
- Quotes: single quotes in TypeScript/TSX and config files.
- Line Length: Prettier `printWidth` is 80.
- File Organization: App Router files live in `app/`; tooling and scripts live
  at the repo root or under `tools/`; static assets live in `public/`.

## Naming

- Files: follow Next.js conventions such as `layout.tsx`, `page.tsx`, and
  `globals.css`; config files stay lowercase and descriptive.
- Functions: camelCase for helpers and `main` for the harness entrypoint.
- Classes: none currently.
- Tests: no test naming pattern is established yet; keep Vitest specs colocated
  with the code they cover when tests are added.

## Imports And Boundaries

- Prefer repo-root aliases from `tsconfig.json` when shared code appears:
  `@/*`, `@ecs/*`, `@gameplay/*`, and `@rendering/*`.
- Keep the App Router shell in `app/` and future game code under `src/game/*`
  if that tree is introduced.
- Respect the configured boundaries: `ecs` should not import `rendering`;
  `gameplay` may depend on `ecs`; `rendering` may depend on `ecs`; `ui` may
  depend on `ui`, `ecs`, and `gameplay`.
- Avoid circular imports; `madge` and `depcruise` are intended to catch them.
- No shared-module import conventions are established yet beyond the aliases and
  local relative imports used today.

## Testing

- `vitest.config.ts` sets `passWithNoTests: true`, so the repo currently tolerates
  an empty test suite.
- No test files exist in the tree today.
- When tests are added, prefer deterministic unit tests over broad integration
  harnesses unless a feature spec says otherwise.

## Logging And Errors

- There is no structured logging library yet.
- Let Next.js, TypeScript, ESLint, and the harness scripts surface failures
  directly instead of swallowing them.
- The harness script should continue returning structured JSON rather than
  free-form logs.

## Library Patterns

| Library Or Tool | Approved Usage Pattern | Avoid |
|-----------------|------------------------|-------|
| Next.js | Use App Router primitives (`app/layout.tsx`, `app/page.tsx`) and export `metadata` from layouts when needed. | Pages Router patterns or hidden global wrappers. |
| Tailwind CSS | Import `tailwindcss` once in `app/globals.css` and express theme tokens with CSS variables and `@theme inline`. | Ad hoc global CSS that bypasses the theme variables. |
| TypeScript | Keep `strict: true` assumptions in mind and use the configured path aliases for shared code. | Disabling type checking or leaning on `any` as a default escape hatch. |
| Harness | Emit machine-readable JSON and keep check ordering explicit. | Shell scripts that only print human text. |

## Component Locations

| Component Type | Preferred Location | Notes |
|----------------|--------------------|-------|
| App route/layout UI | `app/` | Current web surface. |
| Global styling | `app/globals.css` | Tailwind import and theme variables live here. |
| Static assets | `public/` | Icons and other files served by Next.js. |
| Tooling and scripts | `tools/` | Harness and future developer automation. |
| Future ECS/game layers | `src/game/*` | Reserved by aliases and lint rules, but not present yet. |

## Anti-Patterns

- Do not introduce circular dependencies or import cycles.
- Do not let ECS code depend on rendering code.
- Do not add new abstractions just to mimic a future `src/` tree before that
  tree exists.
- Do not treat the scaffold README as the source of truth for runtime behavior.

## Evidence

- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `dependency-cruiser.mjs`
- `knip.json`
- `vitest.config.ts`
- `postcss.config.mjs`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `tools/harness/index.ts`
