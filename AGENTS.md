# General

- You are working in a Typescript project, created with Next.js, BitECS (High performance ECS framework for Typescript) and Three.js
- This project is also a playground for Harness development, so you will find a lot of resouces related to AI Driven Development.
- The project has very strict rules defines about formating, code complexity, circular dependencies, file size, etc, and you should respect these rules.
- After any change, you need to run `pnpm validate:full` to call the self healing harness that will verify the code quality and return a report with errors.
- You should never ignore the errors returned by `pnpm validate:full` command. You should analize the error, apply the fix to the code and run the `pnpm validate:full` command again.

# Project Notes

- **Tool Usage**: Always `read` to confirm exact formatting before `edit` operations.
- **Pathing**: Do not include `@` prefix when passing paths to `read`/`write`/`bash`. `@` is for internal navigation, not filesystem paths.
- File contents are highly sensitive to whitespace/newline patterns. Always use `write` for structural changes, instead of `edit`, and `find_and_replace` tool for very specific changes./

## Tooling notes and common errors

- Tool usage:
  - Always read to confirm exact formatting before edits. Use read to fetch the exact formatting before edits. When planning changes, rely on the read output to preserve spaces and line breaks.
  - Use multi_edit to apply changes to files. For large edits, prefer edits that replace entire sections. After applying changes, run `pnpm validate:full` and address any issues reported by the harness.
- Edit vs Write:
  - Use write for structural changes (e.g., adding sections, reordering content). When using edit/multi_edit for small tweaks, ensure the patch targets the exact string to avoid unintended changes.
- Common errors and how to avoid:
  - Path and quoting mistakes: Do not prefix paths with @; ensure backticks in code blocks are closed properly.
- How to solve:
  - Plan patch, apply patch with multi_edit, then run `pnpm validate:full`.
- Quick workflow recap:
  - 1. Read AGENTS.md
  - 2. Patch via multi_edit
  - 3. Validate
  - 4. Fix issues and re-validate
