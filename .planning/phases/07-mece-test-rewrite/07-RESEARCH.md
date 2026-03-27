# Phase 7: MECE Test Rewrite — Research

**Researched:** 2026-03-27
**Phase Goal:** Rewrite all feature test suites to follow the feather-testing-convex testing philosophy

---

## 1. Testing Philosophy Summary

The [feather-testing-convex TESTING-PHILOSOPHY.md](https://github.com/siraj-samsudeen/feather-testing-convex/blob/main/TESTING-PHILOSOPHY.md) defines:

### Core Principles
- **MECE (Mutually Exclusive, Collectively Exhaustive):** Each component state belongs to exactly one test approach (Integration OR Mock). No overlap between layers, no gaps.
- **Integration-first:** Real in-memory backend via `feather-testing-convex`. Mocks only for transient states (loading spinners, error states).
- **Multiple assertions per test encouraged:** Each test covers one *state* thoroughly. Splitting into one-assertion-per-test is an anti-pattern.
- **E2E is a deliberate exception to MECE:** E2E tests intentionally overlap integration for real-browser confidence on critical journeys (~10 smoke tests).

### Three-Layer Hierarchy
1. **E2E (Playwright):** Happy path protection. Critical user journeys only. Slow, highest confidence.
2. **Integration (feather-testing-convex):** The workhorse. Happy paths + core failure paths. Bulk of coverage.
3. **Unit/Mock:** Edge cases only. Loading, error states — what integration can't reach.

### Key Anti-Patterns to Eliminate
1. **Backend-only tests redundant with integration:** If a frontend integration test already exercises `api.tasks.queries.myTasks`, a separate backend-only test for the same query is redundant.
2. **Mocked component tests when integration is possible:** Mocking `useQuery` to return data when you can use `seed()` + `renderWithConvex`.
3. **Snapshot tests:** No `toMatchSnapshot()`. Assert specific user-visible values.
4. **Weak assertions:** No `toBeDefined()`, `toBeTruthy()`, `toBeInTheDocument()` without content verification.
5. **One-assertion-per-test explosion:** Multiple assertions per state is encouraged, not split.

### 12-Point Review Checklist
1. No mocked backend for data-display tests
2. No redundant backend-only tests
3. Mocks ONLY for transient states (loading, error)
4. Using `seed()` instead of raw DB inserts
5. Using Session DSL for form interactions (if available)
6. Session DSL chains are awaited
7. Not asserting stale UI after mutations
8. Using `findByText` for async data, not `getByText`
9. Multi-user tests use explicit `userId` with `seed`
10. MECE test design — no overlap, no gaps
11. No snapshot tests
12. Assertions verify user-visible behavior, not execution

---

## 2. Current Test File Audit

### 2.1 Test File Inventory

**Total:** 36 test files, 6,487 lines

**Backend tests (16 files, ~3,542 lines):**

| File | Lines | Scope |
|------|-------|-------|
| `convex/tasks/mutations.test.ts` | 905 | Task CRUD, status, assignment, reorder |
| `convex/subtasks/mutations.test.ts` | 593 | Subtask CRUD, reorder, promote |
| `convex/projects/mutations.test.ts` | 334 | Project CRUD, cascade delete |
| `convex/activity-logs/queries.test.ts` | 333 | Activity log queries |
| `convex/work-logs/mutations.test.ts` | 299 | Work log CRUD |
| `convex/tasks/queries.test.ts` | 230 | myTasks, teamPool queries |
| `convex/projects/queries.test.ts` | 199 | Project list, detail queries |
| `convex/users/mutations.test.ts` | 132 | User update, delete |
| `convex/subtasks/queries.test.ts` | 130 | Subtask list queries |
| `convex/work-logs/queries.test.ts` | 128 | Work log queries |
| `convex/devEmails/mutations.test.ts` | 71 | Dev email CRUD |
| `convex/users/queries.test.ts` | 71 | User queries |
| `convex/devEmails/queries.test.ts` | 42 | Dev email queries |
| `convex/onboarding/mutations.test.ts` | 40 | Onboarding completion |
| `convex/auth/queries.test.ts` | 19 | Auth provider queries |
| `convex/uploads/mutations.test.ts` | 16 | Upload mutations |

**Frontend feature tests (8 files, ~1,949 lines):**

| File | Lines | Scope |
|------|-------|-------|
| `src/features/tasks/tasks.test.tsx` | 545 | My Tasks, Team Pool pages |
| `src/features/projects/projects.test.tsx` | 480 | Projects list, detail |
| `src/features/settings/settings.test.tsx` | 299 | Settings page |
| `src/features/auth/components/PasswordResetForm.test.tsx` | 254 | Password reset |
| `src/features/auth/components/PasswordForm.test.tsx` | 252 | Password auth |
| `src/features/onboarding/onboarding.test.tsx` | 68 | Onboarding flow |
| `src/features/dashboard/dashboard.test.tsx` | 33 | Dashboard page |
| `src/features/subtasks/subtasks.test.tsx` | 9 | **STUB** |
| `src/features/work-logs/work-logs.test.tsx` | 9 | **STUB** |

**Frontend utils/shared/UI (8 files, ~534 lines):**

| File | Lines | Scope |
|------|-------|-------|
| `src/ui/use-double-check.test.ts` | 144 | Hook tests |
| `src/shared/utils/time-parser.test.ts` | 74 | Time parsing utils |
| `src/shared/schemas/work-logs.test.ts` | 68 | Zod schema validation |
| `src/ui/sheet.test.tsx` | 67 | Sheet UI component |
| `src/utils/misc.test.ts` | 45 | Miscellaneous utils |
| `src/utils/validators.test.ts` | 37 | Validation utils |
| `src/shared/nav.test.ts` | 32 | Navigation items |
| `src/shared/errors.test.ts` | 27 | Error constants |
| `src/ui/button.test.tsx` | 24 | Button component |

**Out of scope (generators, config):**
- `generators/__tests__/marked-regions.test.ts` (212 lines) — generator infra, not feature code
- `generators/__tests__/yaml-resolver.test.ts` (250 lines) — generator infra, not feature code
- `site.config.test.ts` (16 lines) — static config test

### 2.2 Philosophy Compliance Audit

#### Backend Tests — Key Issues

**Issue B1: Backend-only tests may be redundant with frontend integration tests.**
The philosophy says: "If an integration test already renders a component that calls `api.tasks.queries.myTasks`, a separate backend-only test for `api.tasks.queries.myTasks` is redundant."

However, for THIS project, the backend tests serve a critical role that the philosophy's "delete backend-only tests" guidance must be applied carefully:

- **Backend mutation tests verify auth guards, validation, side effects (activity logs), cascade deletes, and edge cases** — these are NOT exercised by frontend integration tests, which only test the happy path rendering.
- **Backend query tests verify sorting, filtering, auth scoping** — some overlap with frontend tests but many edge cases are backend-only.
- **The frontend test infrastructure uses `ConvexTestQueryAuthProvider` which fires one-shot queries** — mutations that trigger reactive updates cannot be verified through frontend tests alone.

**Verdict on backend tests:** KEEP all backend tests. They are NOT redundant with frontend integration tests because:
1. Frontend tests can't verify auth guards (unauthenticated behavior)
2. Frontend tests can't verify mutation side effects (activity log creation)
3. Frontend tests can't verify cascade delete behavior
4. Frontend tests don't cover edge cases (duplicate titles, invalid IDs, etc.)

The philosophy's anti-pattern of "redundant backend-only tests" applies when you have a frontend integration test that already calls the same query AND verifies the same behavior. In this codebase, backend tests verify behavior that frontend tests don't reach.

**Issue B2: Raw DB inserts instead of seed helpers.**
Many backend tests use `testClient.run(async (ctx: any) => ctx.db.insert(...))` instead of the mutation API or `seed()`. This is acceptable for backend tests where you're testing the mutation itself (you need to set up preconditions without going through the mutation under test). However, some tests that set up data for query tests could use the mutation API instead.

**Issue B3: Some tests use `any` type casts extensively.**
`ctx: any` is used throughout. This is a known limitation of the test setup.

#### Frontend Tests — Key Issues

**Issue F1: Route `beforeLoad` tests are not MECE-relevant.**
Several frontend test files include `describe("Route.beforeLoad", ...)` tests that verify static route context objects. These are pure config tests (no component state), not MECE test subjects. They should be kept but are outside the MECE framework.

**Issue F2: NavItem tests duplicated across feature test files.**
`navItems` tests appear in `tasks.test.tsx`, `projects.test.tsx`, and `src/shared/nav.test.ts`. The `nav.test.ts` file should be the single location for nav tests. Feature files should not duplicate nav assertions.

**Issue F3: Raw DB inserts in frontend tests.**
Frontend tests use `testClient.run(async (ctx: any) => ctx.db.insert("tasks", {...}))` for seeding data. Per the philosophy, these should use `client.mutation(api.tasks.mutations.create, {...})` where the mutation API exists, or the `seed()` helper from `feather-testing-convex` if available.

**Issue F4: Stub tests with `v8 ignore` and `expect(true).toBe(true)`.**
`subtasks.test.tsx` and `work-logs.test.tsx` are stubs wrapped in `v8 ignore`. These need actual tests or should be deleted if the corresponding frontend components are excluded from coverage (which they currently are via `vitest.config.ts` exclude).

**Issue F5: Missing MECE state decomposition.**
Frontend tests don't follow the test matrix pattern. They test specific features but don't systematically enumerate states (loading → empty → with data → error).

**Issue F6: `waitFor` wrapping `getByText` instead of using `findByText`.**
Several tests use the pattern:
```tsx
await waitFor(() => {
  expect(screen.getByText("My Tasks")).toBeInTheDocument();
});
```
Per the philosophy, this should be:
```tsx
expect(await screen.findByText("My Tasks")).toBeInTheDocument();
```

**Issue F7: Some tests verify implementation details, not user-visible behavior.**
Examples: checking `navItems` array structure, `Route.options.beforeLoad` return values. These test internal APIs, not what the user sees.

#### Utils/Shared/UI Tests — Key Issues

**Issue U1: Pure function tests are correctly structured.**
`time-parser.test.ts`, `misc.test.ts`, `validators.test.ts`, `errors.test.ts` test pure functions with specific inputs/outputs. These already comply with the philosophy (no mocks, specific assertions).

**Issue U2: `use-double-check.test.ts` uses `renderHook` correctly.**
This is a hook test that doesn't need integration infrastructure. Already compliant.

**Issue U3: `button.test.tsx` and `sheet.test.tsx` are UI component tests.**
These test Radix wrappers. `button.test.tsx` is minimal (24 lines). `sheet.test.tsx` tests open/close behavior. These are correctly scoped.

**Issue U4: `work-logs.test.ts` (schemas) is a pure validation test.**
Tests Zod schema validation. Already compliant.

### 2.3 Coverage Config Analysis

Current `vitest.config.ts` coverage configuration:
- **Includes:** `src/features/**`, `src/shared/**`, `src/utils/**`, specific `src/ui/` files, `convex/**/*.ts`, `errors.ts`
- **Excludes:** Long list of specific files and patterns

**Issues with current config:**
- `errors.ts` is in both `include` and `exclude` (exclude wins) — should be removed from one
- Many `src/features/*/components/**` files are excluded (subtasks, work-logs, task detail panel components) — these are excluded because they render inside Radix Dialog portals that jsdom can't handle
- `src/routes/**` excluded — thin wrappers, appropriate

---

## 3. Rewrite Strategy

### 3.1 What to Rewrite

**Backend tests (all 16 files):**
- Apply MECE state decomposition where missing
- Replace raw DB inserts with mutation API calls where appropriate (for query test setup)
- Add test matrix comments at the top of each test file
- Standardize test naming to philosophy convention (`"verb what-user-sees [condition]"`)
- Keep all backend tests — they are NOT redundant (see Issue B1 analysis)

**Frontend feature tests (6 active files + 2 stubs):**
- Rewrite with MECE state decomposition (loading → empty → with data → error for each component)
- Replace `waitFor(() => getByText(...))` with `findByText`
- Remove duplicated navItem/route tests (centralize in `shared/nav.test.ts`)
- Replace raw DB inserts with mutation API or seed helpers
- Delete the 2 stub files (their components are excluded from coverage)
- Add proper loading/error mock tests where components have those states

**Frontend utils/shared/UI tests (8 files):**
- Mostly already compliant — light touch
- Remove any navItem tests duplicated from feature files
- Ensure assertions verify specific values, not just existence

### 3.2 What to Keep As-Is

- `src/utils/misc.test.ts` — pure function tests, compliant
- `src/utils/validators.test.ts` — pure function tests, compliant
- `src/shared/utils/time-parser.test.ts` — pure function tests, compliant
- `src/shared/schemas/work-logs.test.ts` — schema validation, compliant
- `src/shared/errors.test.ts` — constant verification, compliant
- `src/ui/use-double-check.test.ts` — hook test, compliant
- `src/ui/button.test.tsx` — UI component test, minimal
- `src/ui/sheet.test.tsx` — UI component test, appropriate

### 3.3 What to Delete

- `src/features/subtasks/subtasks.test.tsx` — stub with `expect(true).toBe(true)`, components excluded from coverage
- `src/features/work-logs/work-logs.test.tsx` — stub with `expect(true).toBe(true)`, components excluded from coverage

### 3.4 Coverage Config Changes

- Remove `errors.ts` from `include` (it's already in `exclude`)
- Verify all production files in `src/features/` are captured by the glob
- No other changes needed — current config is glob-based and resilient

### 3.5 Plan Decomposition

The rewrite can be split into logical waves:

**Wave 1: Backend test rewrite (independent)**
- All 16 `convex/**/*.test.ts` files
- Can be done independently of frontend rewrites
- Largest volume (3,542 lines)

**Wave 2: Frontend feature test rewrite (depends on Wave 1 patterns)**
- 6 active frontend feature test files
- Delete 2 stubs
- Depends on backend tests being stable (frontend tests call backend mutations)

**Wave 3: Utils/shared/UI cleanup + coverage config (independent)**
- 8 utils/shared/UI test files — light touch
- `vitest.config.ts` coverage config update
- Nav test centralization

---

## 4. Risk Assessment

### Low Risk
- Pure function tests (utils, validators, time-parser) — already compliant, minimal changes
- UI component tests (button, sheet, use-double-check) — already well-structured

### Medium Risk
- Backend test rewrite — large volume but straightforward pattern application
- Coverage config — must maintain 100% thresholds throughout

### High Risk
- Frontend feature test rewrite — most deviation from philosophy, requires careful MECE state analysis
- Auth form tests (PasswordForm, PasswordResetForm) — complex multi-step forms with loading/error states
- Task page tests — largest frontend test file (545 lines), most complex component

### Mitigation
- Run `npm test` after each file rewrite to verify 100% coverage maintained
- Rewrite one domain at a time (tasks, then projects, then auth, etc.)
- Keep backend tests stable before touching frontend tests

---

## 5. Validation Architecture

### Acceptance Criteria (derived from philosophy)

For each rewritten test file:
1. **MECE compliance:** Test matrix comment at top, one test per state, no overlap between integration and mock
2. **Integration-first:** Data-display tests use real backend, not mocks
3. **No redundant backend-only tests:** If a frontend integration test exercises the same query + behavior
4. **No snapshot tests:** Zero `toMatchSnapshot()` calls
5. **No weak assertions:** Zero `toBeDefined()`, `toBeTruthy()` without content verification
6. **Proper async:** `findByText` for async data, not `waitFor(() => getByText(...))`
7. **Seed helpers or mutation API:** No raw `ctx.db.insert()` for test setup (except where testing the mutation itself)
8. **Philosophy-compliant naming:** `"verb what-user-sees [condition]"` pattern
9. **Coverage maintained:** `npm test` passes with 100% thresholds

### Verification Commands

```bash
# Full test suite with coverage
npm test

# Check for anti-patterns
grep -r "toMatchSnapshot" src/ convex/ --include="*.test.*"
grep -r "toBeDefined()" src/ convex/ --include="*.test.*"
grep -r "expect(true)" src/ convex/ --include="*.test.*"
```

---

## RESEARCH COMPLETE

*Phase: 07-mece-test-rewrite*
*Research completed: 2026-03-27*
