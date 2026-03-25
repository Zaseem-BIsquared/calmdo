# Phase 03 UAT: Tasks

**Date:** 2026-03-25
**Tester:** User (manual)
**Status:** PASS (bug resolved in Phase 03.1)

## Test Results

| # | Test | Criterion | Result | Notes |
|---|------|-----------|--------|-------|
| 0 | Auth flow | Pre-req | PASS | JWT_PRIVATE_KEY missing on local (todo captured), signup duplicate error UX (todo captured) |
| 1 | Task CRUD | SC-1 | PASS | Create, inline edit, priority toggle, delete with confirmation all work |
| 2 | Status workflow | SC-2 | PASS | todo → in_progress → done, stops at done |
| 3 | Assignment + visibility | SC-3 | PASS (fixed in 03.1) | Unassign now auto-flips visibility to "shared" |
| 4 | My Tasks + Team Pool views | SC-4 | PASS | Both pages load and display correctly |
| 5 | Navigation | SC-5 | PASS | My Tasks and Team Pool in top nav bar (not sidebar — existing layout pattern) |

## Bugs Found

### BUG-01: Unassign leaves task in limbo — RESOLVED
- **Severity:** P1
- **File:** convex/tasks/mutations.ts (assign handler)
- **Issue:** Unassigning doesn't flip visibility to "shared", so task is not in My Tasks (no assignee) or Team Pool (still private)
- **Fix:** Auto-flip visibility to "shared" on unassign
- **Resolved in:** Phase 03.1, Plan 01 (commit 44717c6)

## Pre-existing Issues Captured

- .planning/todos/dx-local-auth-keys-provisioning.md — JWT_PRIVATE_KEY not auto-provisioned for local backend
- .planning/todos/dx-auth-duplicate-account-error.md — Raw "account already exists" error on retry signup
- .planning/todos/ux-username-case-feedback.md — Username silently lowercased, settings form doesn't re-sync

## Observations

- Navigation is top horizontal bar, not sidebar. VIEW-06 says "sidebar" but plans correctly followed existing layout pattern. Sidebar redesign out of scope.
- Projects nav item missing (expected — Phase 4 deliverable)
