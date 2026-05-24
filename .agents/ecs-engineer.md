# Autonomous Harness Loop

After ANY structural change:

1. Run:

```bash
pnpm harness
```

2. Parse the JSON response.

3. If success=true:
   stop
   summarize changes
4. If success=false:
   analyze ALL failures
   prioritize in this order: - typecheck - lint - test - depcruise - knip - complexity

5. Apply fixes.

6. Rerun harness.

7. Never stop while harness returns failures.

8. Never ignore:
   - circular dependencies
   - dead code
   - unused exports
   - architectural violations

9. Prefer deleting unused code over disabling rules.

10. Never silence errors unless explicitly requested.
