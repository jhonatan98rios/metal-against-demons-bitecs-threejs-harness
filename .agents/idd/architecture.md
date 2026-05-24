# Architecture

## Summary

This repository is a brownfield Next.js 16 app shell with a single App Router
route, global Tailwind-based styling, and a local validation harness. The code
is still scaffold-level: there is no `src/` domain tree, no persistence layer,
and no external service integration configured yet. The repository name and
lint/dependency rules suggest a future ECS/Three.js game harness, but that shape
is not implemented in the current tree.

## Mode

- Mode: brownfield
- Source: discovery
- Last Updated: 2026-05-24

## Projects

| Name | Path | Role | Notes |
|------|------|------|-------|
| Next.js app shell | `.` | Web app | Root App Router scaffold serving `/` from `app/page.tsx`; layout and global styles live under `app/`. |
| Local QA/tooling | `tools/` and root config files | Developer tooling | Harness, lint, dependency, test, and complexity checks run locally through `pnpm` scripts. |

## Capabilities

- Serves a single web route at `/`.
- Applies global styling through Tailwind CSS v4 and CSS variables in
  `app/globals.css`.
- Exposes a Node-based harness that returns structured JSON for agent
  consumption.
- Enforces typed linting, complexity limits, boundary rules, and unused-code
  checks on the current repo shape.
- Carries path aliases for future `src/game/{ecs,gameplay,rendering}` layers,
  although those files do not exist yet.

## Runtime Topology

The runtime is a single Next.js web app backed by local developer tooling. The
browser loads the root route, Next.js serves the App Router page and static
assets, and the harness script runs in Node.js when invoked from the command
line.

| Component | Type | Runtime Or Host | Notes |
|-----------|------|-----------------|-------|
| Browser client | Web client | Browser | Consumes the root page rendered by Next.js. |
| Next.js app server | Web app | Node.js | Serves the App Router layout, page, and `public/` assets. |
| Harness CLI | Validation job | Node.js | Runs lint, typecheck, test, and optionally heavier checks based on diff size. |

## Data Stores

| Name | Type | Used By | Notes |
|------|------|---------|-------|
| None | N/A | N/A | No database, cache, or other persistent store is configured. |

## Integrations

| System | Direction | Purpose | Notes |
|--------|-----------|---------|-------|
| Next.js | Runtime framework | Web application shell | App Router project on Next 16.2.6. |
| React | Runtime framework | UI rendering | Used through Next.js and the app route components. |
| Tailwind CSS v4 | Styling framework | Global styling | Imported through `app/globals.css` with `@theme inline`. |
| ESLint / dependency-cruiser / Knip / Vitest / Madge / Lizard | Local tooling | Quality gates | Wired through `package.json` scripts and `tools/harness/index.ts`. |

## Open Questions

- Should the repository evolve into a 3D game harness with ECS and Three.js code
  under `src/game/*`, or is the current App Router shell only a temporary
  scaffold?
- `pnpm` scripts are primary, but `bun.lock` is also present. Which package
  manager should be treated as canonical?
- The README still reads like stock create-next-app output and mentions
  `next/font` and Vercel, but the app code does not currently use those
  integrations.
- There is no CI workflow or deployment descriptor in the repo yet.

## Evidence

- `package.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `dependency-cruiser.mjs`
- `knip.json`
- `vitest.config.ts`
- `postcss.config.mjs`
- `tools/harness/index.ts`
- `README.md`
