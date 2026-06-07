---
name: code-reviewer
description: Automated code quality review covering correctness bugs, simplification, reuse, and efficiency. Use when reviewing a diff, PR, or specific file. Runs four parallel passes and applies fixes. Invoke with /code-reviewer [target] or let Claude activate it automatically during review tasks.
context: fork
agent: general-purpose
---

# Code Reviewer — Quality & Simplification

Run four independent review passes on the target code, then consolidate and apply all non-controversial fixes.

## Target

$ARGUMENTS

If no target is given, review the current git diff: !`git diff HEAD --stat`

## Current diff summary

```!
git diff HEAD --name-only 2>/dev/null || echo "(no uncommitted changes — review recent commit)"
```

---

## Pass 1 — Correctness Bugs

Hunt for logic errors, not style. Report only if confident.

Checklist:
- Off-by-one errors, wrong comparison operators (`>` vs `>=`)
- Null / undefined dereferences without guards
- Async code: missing `await`, unhandled promise rejections, race conditions
- Stale closures capturing outdated state in React hooks
- Missing dependency arrays in `useEffect` / `useMemo` / `useCallback`
- State mutations (mutating React state directly instead of spreading)
- Server actions returning sensitive data that shouldn't be exposed
- Missing `enabled: !!param` guards in React Query `useQuery` calls
- Form submit handlers that don't prevent default or handle errors

---

## Pass 2 — Reuse & DRY

Find duplicated logic that already exists elsewhere or should be extracted.

Checklist:
- Logic duplicated 2+ times → extract to a utility in `src/lib/utils.ts` or a shared hook
- Inline calculations that duplicate the pattern from other components (e.g. ROI formula)
- Repeated `cn(...)` class strings — extract to a named constant
- Duplicate server action patterns — check `src/app/actions/` before writing a new one
- Repeated fetch patterns — check `src/hooks/` before writing a new `useQuery`
- `formatCurrency()` already exists in `@/lib/utils` — never reimplement it inline

---

## Pass 3 — Simplification

Make the code shorter and clearer without changing behavior.

Checklist:
- Functions longer than 30 lines are likely doing too much — split them
- Nested ternaries deeper than 2 levels → early returns or a lookup map
- `useEffect` that only runs once and doesn't clean up → move to an event handler
- `useState` + `useEffect` for derived data → replace with `useMemo`
- Boolean prop names: prefer `isLoading` over `loading`, `hasError` over `error` (when boolean)
- Unnecessary `else` after a `return` — remove it
- `array.filter().map()` chains that can be a single `reduce` or a combined loop
- Redundant type annotations that TypeScript can infer

---

## Pass 4 — Efficiency & Altitude

Look for performance issues and wrong-level abstractions.

Checklist:
- Missing `key` props on list items, or `key={index}` on reorderable lists
- Large lists rendered without virtual scrolling — `useVirtualScroll` exists in this project
- Expensive computations in render without `useMemo`
- Objects / arrays created inline as default prop values (causes re-renders)
- `queryClient.invalidateQueries` called with no key (invalidates everything)
- Overfetching: fetching a full list when only one item is needed
- Server actions that run N+1 Prisma queries — use `include` or batch
- Component doing too much (fetching + rendering + business logic) — split concerns

---

## Output format

For each finding:

```
[PASS] [FILE:LINE] [SEVERITY: bug | warn | info]
Problem: one sentence
Fix: one sentence or code snippet
```

Severity guide:
- `bug` — incorrect behavior, will cause errors or wrong results
- `warn` — will cause problems under load, edge cases, or maintenance burden
- `info` — simplification, style, minor efficiency gain

---

## After the review

1. List all findings grouped by severity
2. For `bug` and `warn` items: apply fixes directly to the files
3. For `info` items: apply only if the change is a clear improvement with no tradeoffs
4. Run `bun lint` after applying fixes: !`cd /home/anwar/Workspace/Projects/own-projects/financial-hive-app && bun lint 2>&1 | tail -20`
5. Report what was fixed and what was left for the developer to decide
