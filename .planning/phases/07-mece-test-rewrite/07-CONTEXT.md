# Phase 7: MECE Test Rewrite - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite ALL existing test suites — features, utils, shared, and UI — to follow the [feather-testing-convex testing philosophy](https://github.com/siraj-samsudeen/feather-testing-convex/blob/main/TESTING-PHILOSOPHY.md). This is a test-only phase: no production code changes, only test files and coverage config.

</domain>

<decisions>
## Implementation Decisions

### Scope
- **D-01:** Rewrite ALL test files, not just feature tests — includes utils, shared, and UI test files
- **D-02:** Both backend (`convex/**/*.test.ts`) and frontend (`src/**/*.test.{ts,tsx}`) suites are in scope
- **D-03:** The testing philosophy doc is the single source of truth for what "correct" looks like

### Approach
- **D-04:** Audit each test file against the philosophy's review checklist, then rewrite to comply
- **D-05:** Integration-first: real backend via `convex-test`/`feather-testing-convex`, no mocks except for loading/error states
- **D-06:** MECE state decomposition: one test per state, no overlap between integration and mock layers, no gaps
- **D-07:** Delete tests that are redundant or don't verify user-visible behavior
- **D-08:** Keep tests that already comply with the philosophy as-is (don't rewrite for the sake of rewriting)

### Coverage
- **D-09:** Update `vitest.config.ts` coverage `include` array to capture all production files (current config is an explicit allowlist that may be stale)
- **D-10:** Maintain 100% coverage thresholds throughout the rewrite

### Claude's Discretion
- Test file organization within each suite (grouping, describe block structure)
- Order of test rewrites across features
- Whether to split large test files or keep them consolidated

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Testing philosophy
- [feather-testing-convex TESTING-PHILOSOPHY.md](https://github.com/siraj-samsudeen/feather-testing-convex/blob/main/TESTING-PHILOSOPHY.md) — The single source of truth for how tests should be structured: integration-first, MECE layers, 12-point review checklist

### Project testing setup
- `.planning/codebase/TESTING.md` — Current test patterns, fixtures, helpers, coverage config
- `.claude/rules/feather-starter-convex-testing.md` — Project-specific test setup (environments, fixtures, frontend helpers)

### Test infrastructure
- `convex/test.setup.ts` — Backend test fixtures (`createConvexTest`, seed helpers)
- `src/test-helpers.tsx` — Frontend `renderWithRouter` helper
- `vitest.config.ts` — Test runner config, coverage includes/excludes

</canonical_refs>

<code_context>
## Existing Code Insights

### Test Files to Rewrite

**Backend (16 files):**
- `convex/uploads/mutations.test.ts`
- `convex/devEmails/mutations.test.ts`, `convex/devEmails/queries.test.ts`
- `convex/onboarding/mutations.test.ts`
- `convex/users/mutations.test.ts`, `convex/users/queries.test.ts`
- `convex/auth/queries.test.ts`
- `convex/projects/queries.test.ts`, `convex/projects/mutations.test.ts`
- `convex/subtasks/queries.test.ts`, `convex/subtasks/mutations.test.ts`
- `convex/work-logs/queries.test.ts`, `convex/work-logs/mutations.test.ts`
- `convex/tasks/queries.test.ts`, `convex/tasks/mutations.test.ts`
- `convex/activity-logs/queries.test.ts`

**Frontend features (8 files):**
- `src/features/tasks/tasks.test.tsx`
- `src/features/auth/components/PasswordForm.test.tsx`
- `src/features/auth/components/PasswordResetForm.test.tsx`
- `src/features/onboarding/onboarding.test.tsx`
- `src/features/settings/settings.test.tsx`
- `src/features/projects/projects.test.tsx`
- `src/features/subtasks/subtasks.test.tsx`
- `src/features/work-logs/work-logs.test.tsx`
- `src/features/dashboard/dashboard.test.tsx`

**Frontend utils/shared/UI (8 files):**
- `src/utils/validators.test.ts`, `src/utils/misc.test.ts`
- `src/shared/nav.test.ts`, `src/shared/errors.test.ts`
- `src/shared/utils/time-parser.test.ts`, `src/shared/schemas/work-logs.test.ts`
- `src/ui/use-double-check.test.ts`, `src/ui/button.test.tsx`, `src/ui/sheet.test.tsx`

### Established Patterns
- Backend tests use `test` fixture from `convex/test.setup.ts` providing `{ client, testClient, userId }`
- Frontend tests use `renderWithRouter` from `src/test-helpers.tsx` with real TanStack Router + Convex backend
- No mocking of Convex, React Query, or TanStack Router (by design)

### Integration Points
- `vitest.config.ts` coverage config must be updated to reflect any new/removed test files
- Pre-commit hook enforces 100% coverage — all rewrites must pass before committing

</code_context>

<specifics>
## Specific Ideas

- The testing philosophy doc's 12-point review checklist is the acceptance criteria for each rewritten test file
- User explicitly said "all areas including utils" — no test file is exempt from the rewrite

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-mece-test-rewrite*
*Context gathered: 2026-03-27*
