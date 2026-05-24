# Inventory

## Summary

A single Next.js App Router shell plus local QA tooling. There are no domain
modules, data models, or backend jobs yet.

## Projects

| Name                 | Path                           | Role             | Notes                                                                       |
| -------------------- | ------------------------------ | ---------------- | --------------------------------------------------------------------------- |
| Web app shell        | `.`                            | App Router app   | Root route and global styling live under `app/`; no `src/` tree exists yet. |
| Tooling / automation | `tools/` and root config files | Local validation | Harness and quality configs live outside the app tree.                      |

## Modules

| Name              | Path                                                                                                                                                    | Role              | Notes                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| Root layout       | `app/layout.tsx`                                                                                                                                        | App shell         | Defines the `<html>` / `<body>` wrapper and root metadata.                      |
| Home page         | `app/page.tsx`                                                                                                                                          | Route component   | Renders the `/` route; currently an empty centered shell.                       |
| Global stylesheet | `app/globals.css`                                                                                                                                       | Styling module    | Imports Tailwind v4, defines theme variables, and sets body defaults.           |
| Harness script    | `tools/harness/index.ts`                                                                                                                                | Validation runner | Runs lint/typecheck/test and optional heavy checks in parallel, returning JSON. |
| Tooling configs   | `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `dependency-cruiser.mjs`, `knip.json`, `vitest.config.ts`, `postcss.config.mjs` | Config            | Define scripts, aliases, lint/boundary rules, tests, and styling integration.   |

## Entrypoints

| Name                   | Path                     | Type              | Notes                             |
| ---------------------- | ------------------------ | ----------------- | --------------------------------- |
| App Router root layout | `app/layout.tsx`         | App entrypoint    | Root layout for all routes.       |
| Home route             | `app/page.tsx`           | Route entrypoint  | Handles `/`.                      |
| Harness CLI            | `tools/harness/index.ts` | Script entrypoint | Invoked by `pnpm harness`.        |
| Next config            | `next.config.ts`         | Framework config  | Default `NextConfig` placeholder. |

## Routes

| Route | Method | Path           | Notes                                                            |
| ----- | ------ | -------------- | ---------------------------------------------------------------- |
| `/`   | GET    | `app/page.tsx` | Current home page; no dynamic data or nested routes are defined. |

## Data Models

| Name | Path | Type | Notes                                                        |
| ---- | ---- | ---- | ------------------------------------------------------------ |
| None | N/A  | N/A  | No persistence-backed or domain data models are defined yet. |

## Jobs

| Name                  | Path                                        | Trigger            | Notes                                                                                                                            |
| --------------------- | ------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Local harness         | `tools/harness/index.ts` via `pnpm harness` | Manual / pre-merge | Runs lint, typecheck, and test in parallel; adds `depcruise`, `knip`, and `complexity` when the diff exceeds 100 inserted lines. |
| Circular import check | `package.json` via `pnpm imports`           | Manual             | Runs `madge` against `src`; currently points at a non-existent `src/` tree.                                                      |

## Evidence

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `tools/harness/index.ts`
- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `dependency-cruiser.mjs`
- `knip.json`
- `vitest.config.ts`
- `postcss.config.mjs`
