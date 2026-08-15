---
name: implement
description: Deterministic synchronous pipeline — recon (scout) -> worker -> validator (reviewer), one step at a time, isolated fresh contexts. Use for small-context local models so the parent never orchestrates step-by-step. Run with: /run-chain implement -- <task>
---

## scout

phase: Recon
label: Map the code
as: recon

Map this repo so a worker can implement the task without scanning the whole repo. Find: entry points, key components/systems, what connects to what, files most likely to need changes. Do NOT decide architecture. Do NOT modify any project files. Do NOT spawn subagents. Return a compact file list with 1-3 line summaries per file.

Task: {task}

## worker

phase: Implement
label: Implement the task
as: worker

Implement the task below. Use the recon map as your guide — do not re-scan the whole repo. Follow project style (small helpers, no circular imports). Validate with `pnpm lint` and `pnpm typecheck` (do NOT run `pnpm test` — vitest crashes with SIGILL on this Android device, pre-existing). Do NOT spawn subagents. Report: files changed with line refs, commands run with exit codes, validation evidence, anything left undone.

Task: {task}

Recon map:
{outputs.recon}

## reviewer

phase: Validate
label: Validate the implementation

Validate the implementation of the task below by inspecting the repo directly (git diff and files) — do NOT trust the worker's self-report. Do NOT modify any files. Do NOT spawn subagents. Check: correctness, scope (no unrelated changes), style/consistency, and re-run `pnpm lint` and `pnpm typecheck`. Reply with exactly:

VERDICT: PASS (or FAIL)
EVIDENCE: one line per check
ISSUES: concrete problems or "none"

Task: {task}

Worker handoff:
{outputs.worker}
