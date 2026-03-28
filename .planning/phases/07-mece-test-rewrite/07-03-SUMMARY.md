---
phase: 07-mece-test-rewrite
plan: 03
subsystem: testing
tags: [vitest, frontend-tests, mece, findBy, integration-tests]

requires:
  - phase: 07-01
    provides: MECE-compliant backend tests
  - phase: 07-02
    provides: Centralized nav tests, deleted stubs
provides:
  - MECE-compliant frontend feature test suite
  - findBy* pattern for async element queries
  - Centralized route/nav tests (removed from features)
affects: []

tech-stack:
  added: []
  patterns: [findBy* for async queries, waitFor only for non-query assertions]

key-files:
  modified:
    - src/features/tasks/tasks.test.tsx
    - src/features/projects/projects.test.tsx
    - src/features/settings/settings.test.tsx
    - src/features/onboarding/onboarding.test.tsx
    - src/features/dashboard/dashboard.test.tsx
    - src/features/auth/components/PasswordForm.test.tsx
    - src/features/auth/components/PasswordResetForm.test.tsx

key-decisions:
  - Removed beforeLoad tests from all feature files (static config, not user-visible behavior)
  - Removed navItems tests from feature files (centralized in nav.test.ts)
  - Kept waitFor for className assertions and backend state checks (non-query assertions)
  - Auth form tests retain mock of useAuthActions (legitimate external dependency)

requirements-completed: []
duration: 6 min
completed: 2026-03-28
---

# Phase 07 Plan 03: Frontend Feature Test Rewrite — MECE State Decomposition

All 7 frontend feature test files rewritten with MECE test matrices, findBy* async patterns, and removal of duplicate route/nav tests.

## Execution Summary

- **Duration:** ~6 min
- **Tasks:** 5 (4 rewrite + 1 verification)
- **Files modified:** 7
- **Tests:** 300 passing (down from 318 — removed 18 duplicate route/nav tests)

## What Was Built

- All 7 frontend test files have MECE test matrix comments
- Replaced `waitFor(() => getBy*())` with `findBy*()` for element presence queries
- Reserved `waitFor` only for non-query assertions (className checks, backend state via client.query)
- Removed all `describe("beforeLoad")` blocks from feature tests (5 blocks)
- Removed all `describe("navItems")` blocks from feature tests (2 blocks)
- Auth form tests retain legitimate mock of `useAuthActions` (external auth dependency)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.
