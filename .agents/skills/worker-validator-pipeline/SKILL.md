---
name: worker-validator-pipeline
description: Sequential synchronous subagent orchestration for small-context local models. Use when running with limited context windows (e.g. ~40k) and needing to implement features by decomposing them into tasks, spawning one worker subagent at a time (never parallel, never async) followed by a validator subagent, iterating until the task is done.
---

# Worker → Validator Synchronous Pipeline

## Context / Why this exists

Small local models (e.g. Qwen 3.8 27B on a 12GB GPU → ~40k context window) cannot
hold large codebases or long conversations. Instead of loading everything into one
context, the **parent agent stays small** and orchestrates:

1. The parent decomposes a feature into small, well-scoped tasks.
2. For each task: spawn **one recon (scout)** subagent → it maps the code so the worker doesn't scan the repo → returns.
3. Then spawn **one worker** subagent with that map → it runs to completion → returns.
4. Then spawn **one validator** subagent → it verifies the worker's work → returns.
5. On FAIL: the parent synthesizes the fix and spawns the next worker for it.
6. Move to the next task. Repeat until the feature is done.

Each subagent runs with an **isolated fresh context**: it only sees its task, so
context usage is bounded per task regardless of model limits.

## Hard rules

- **Synchronous only.** Every `subagent(...)` call blocks until the child finishes.
  Never pass `async: true`. Never use `tasks: [...]` (that is parallel). Never use
  `worktree: true`. One child at a time, always.
- **Always `context: "fresh"`.** Builtin `worker`/`planner`/`oracle` default to
  forked context (inherits parent history — the opposite of what we want, and it
  requires a persisted parent session). Fresh context = isolated task context.
- **Workers edit; validators read-only.** The validator must never modify files.
- **Children never spawn subagents.** Orchestration lives only in the parent.
- **The parent is the only decision-maker.** It decomposes, writes task prompts,
  reads handoffs, and decides pass/fail.

## How to spawn (verified mechanics)

### Recon / researcher (synchronous, blocks until done)

The recon stage runs **before the worker**. Its job: read the existing code and
answer _what is where, what will need to change, what connects to what_ — returning
a list of files with small summaries. It must NOT decide architecture (that is the
parent's job) and must NOT modify files.

Use the builtin **`scout`** agent for this role. ⚠️ Do not confuse it with the
builtin `researcher`, which does **web** research (web_search/fetch_content), not
local code recon.

```typescript
subagent({
  agent: 'scout',
  context: 'fresh',
  task: 'Map this repo so a worker implementing <feature> does not scan the whole repo.\nFind: entry points, key components/systems, what connects to what, files most likely to need changes.\nDo NOT decide architecture. Do NOT modify project files. Do NOT spawn subagents.\nWrite findings to <path> as a compact file list with 1-3 line summaries each.'
})
```

Notes:

- Scout has a default `output: context.md` and writes its full report to a
  per-run artifact path under `.pi-subagents/artifacts/outputs/`. Pass an explicit
  `output` + `outputMode: "file-only"` in the subagent call when you want the
  parent to receive only a compact file reference instead of the full report
  (important for keeping the parent's small context small).
- The parent then includes the recon (content or path) in the worker's task
  prompt. The worker reads it with fresh context instead of scanning the repo.
- `.pi-subagents/` (runtime artifacts) is gitignored.

### Worker (synchronous, blocks until done)

```typescript
subagent({
  agent: 'worker',
  context: 'fresh',
  task: 'Implement X.\n\nGoal: ...\nContext/evidence: ...\nSuccess criteria: ...\nHard constraints: only edit these files; do not spawn subagents.\nValidation: run `pnpm validate:full`.\nOutput: report changed files, commands run with exit codes, validation evidence, and anything left undone.'
})
```

A single-agent call without `async: true` is a foreground/blocking run: the parent
does not continue until the worker has executed to completion and returned its
handoff.

### Validator (synchronous, read-only)

```typescript
subagent({
  agent: 'reviewer',
  context: 'fresh',
  task: 'Validate the work from the previous worker.\n\nCheck: ...\nDo NOT modify any files. Do NOT spawn subagents.\nReply with exactly:\nVERDICT: PASS (or FAIL)\nEVIDENCE: one line per check.'
})
```

The validator inspects the actual repo/artifacts from a fresh context and returns
a structured verdict, so the parent never trusts the worker's self-report alone.

### Task prompt contract (each worker task)

- **Goal**: concrete outcome.
- **Context/evidence**: paths, diffs, decisions already approved.
- **Success criteria**: what must be true before the child finishes.
- **Hard constraints**: invariants only — files in scope, no subagents, no parallel.
- **Validation**: targeted commands to run.
- **Output**: expected handoff shape (changed files, commands + exit codes, evidence).
- **Stop rules**: when to escalate instead of guessing.

## Pipeline loop

```
for each task in decomposed_tasks:
  recon  = subagent({ agent: "scout",    context: "fresh", task: <map code for task> })
  worker = subagent({ agent: "worker",   context: "fresh", task: <task + recon> })
  verdict = subagent({ agent: "reviewer", context: "fresh", task: <validate worker> })
  while verdict == FAIL and rounds < 3:
    fix_task = parent_synthesizes(verdict.evidence)
    worker = subagent({ agent: "worker", context: "fresh", task: fix_task })
    verdict = subagent({ agent: "reviewer", context: "fresh", task: <validate again> })
    rounds += 1
```

If consecutive tasks share the same area of the repo, run recon once per feature
and reuse the map for all its tasks instead of re-running it per task.

Cap fix rounds at 3 by default; if still failing, escalate to the user instead of
looping forever.

## Deterministic mode (no model orchestration)

Small local models burn context "deciding how to orchestrate" (long thinking
before each subagent call). Two config files remove that entirely:

### 1. `.pi/settings.json` (project scope) — kill the deliberation

```json
{
  "defaultThinkingLevel": "low",
  "subagents": {
    "agentOverrides": {
      "worker": { "thinking": "low", "defaultContext": "fresh" },
      "reviewer": { "thinking": "low", "defaultContext": "fresh" },
      "scout": { "thinking": "low", "defaultContext": "fresh" }
    }
  }
}
```

- `defaultThinkingLevel: "low"` stops the parent's long monologue before every
  tool call (the #1 context burner for orchestration).
- `thinking: "low"` on subagents stops their deliberation too.
- `defaultContext: "fresh"` removes the builtin worker's fork default (fork needs
  a persisted parent session; fresh is what this pipeline needs anyway).
- Project scope only — the user's global settings stay untouched.

### 2. `.pi/chains/implement.chain.md` — deterministic linear graph

The saved chain declares recon → worker → validator once. The parent makes ONE
call (`/run-chain implement -- <task>`) and the runtime enforces the order — no
step-by-step decisions for the model. Steps pass results via `{outputs.recon}` /
`{outputs.worker}`. Verified: 3 steps in 1m2s, PASS, parent result was a compact
summary (artifacts under `.pi-subagents/chain-runs/`).

**Chain limitation:** `.chain.md`/`.chain.json` are DAGs — no loops or
conditionals. The fix loop stays with the parent: on `VERDICT: FAIL`, re-run the
chain with a fix task (cheap with low thinking). Full loops in the graph require
a custom extension (deterministic state machine driving pi-subagents via RPC).

## Verified test log (2026-08-15)

Environment: this project (Next.js + BitECS + Three.js, Termux/Android).

- Spawned a fresh-context `worker` synchronously with a tiny artifact task. The
  call returned only after the worker executed to completion and reported its
  handoff (changed files, validation evidence). ✓ blocking behavior confirmed.
- Verified the artifact on disk with `cat` — content matched the task spec.
- Spawned a fresh-context `reviewer` synchronously to validate the artifact.
  Returned `VERDICT: PASS` with one evidence line per check. ✓
- Spawned a fresh-context `scout` (recon stage) synchronously with a real repo-map
  task. The call returned only after it executed to completion; it produced a
  133-line map (entry points, ECS components/systems, data flow, files likely to
  change) and wrote it both to the instructed `$TMPDIR` path and its default
  artifact path. ✓ blocking + isolation confirmed for the recon stage too.
- No parent context growth: parent only issued prompts and read handoffs.

### First real end-to-end run (same day, billboard bug)

Bug: 2D projectile sprites stayed oriented toward the top-down camera in
first-person mode → edge-on/invisible. Full pipeline ran synchronously:

1. **recon (scout)** — mapped the billboard/camera code: enemies face camera via
   cylindrical Y-rotation in `updateEnemyInstance`; projectiles render through
   `renderNonEnemy` → `syncPosition` (position only); `Billboard` component was
   write-only dead data; player has no Billboard flag; one shared camera object
   for both modes. Output: `/data/data/com.termux/files/usr/tmp/pipeline-recon/billboard-bug.md`.
2. **worker** — fixed `src/game/rendering/createRenderSystem.ts` (+25/-2):
   `syncBillboardRotation` helper (reuses enemy math + module-level `_rot`/`_up`,
   early-return when `Billboard.isBillboard[eid] === 0`), called every frame in
   `renderNonEnemy`; single `cam` capture shared by both paths. `pnpm lint` and
   `pnpm typecheck` exit 0.
3. **validator (reviewer)** — inspected the real diff independently, re-ran lint +
   typecheck, confirmed correctness (same math as enemies), scoping (player/shadows
   unaffected, enemy path untouched), zero per-frame allocations, single cam
   capture, no circular imports. **VERDICT: PASS**, no blocking issues.

Takeaways: the recon map made the worker fix land in one shot with zero reviewer
findings; parent context stayed small throughout (only prompts + handoff reads).

### Environment caveats found during the test

- **No `/tmp` on Termux/Android.** Literal `/tmp` paths fail (read-only). Use
  `$TMPDIR` (`/data/data/com.termux/files/usr/tmp`) or project-relative paths for
  artifacts.
- **Worker defaults to forked context** — always pass `context: "fresh"` or the
  launch may fail when no persisted parent session exists.
- Project rule: after any change, run `pnpm validate:full` and fix reported errors.
