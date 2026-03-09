---
phase: 01-architecture-modernization
plan: 04
subsystem: ui
tags: [react, feature-folders, barrel-exports, thin-routes, tanstack-router]

# Dependency graph
requires:
  - phase: 01-03
    provides: "Dashboard, billing, settings feature folders with extracted components"
provides:
  - All 6 feature domains complete (auth, onboarding, uploads added)
  - All route files converted to thin wrappers (under 20 lines each)
  - Navigation component decoupled from Route object imports
  - Co-located onboarding tests in feature folder
affects: [01-05, 01-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route files are thin wrappers: import component from feature, define Route with beforeLoad"
    - "Feature components use string paths instead of Route.fullPath for navigation"
    - "-ui convention files re-export from feature folders"

key-files:
  created:
    - src/features/onboarding/components/UsernamePage.tsx
    - src/features/onboarding/index.ts
    - src/features/onboarding/onboarding.test.tsx
    - src/features/auth/index.ts
    - src/features/uploads/index.ts
  modified:
    - src/routes/_app/_auth/dashboard/_layout.index.tsx
    - src/routes/_app/_auth/dashboard/_layout.checkout.tsx
    - src/routes/_app/_auth/dashboard/_layout.settings.index.tsx
    - src/routes/_app/_auth/dashboard/_layout.settings.billing.tsx
    - src/routes/_app/_auth/onboarding/_layout.username.tsx
    - src/routes/_app/_auth/dashboard/-ui.navigation.tsx
    - src/features/dashboard/components/Navigation.tsx
    - src/features/billing/components/CheckoutPage.tsx
    - vitest.config.ts

key-decisions:
  - "Navigation component uses string path constants instead of Route.fullPath imports to break circular dependency between features and routes"
  - "Coverage config excludes barrel exports (index.ts) and Navigation shell component (Radix dropdown menus, not unit-testable)"

patterns-established:
  - "Thin route pattern: import component, createFileRoute with beforeLoad metadata, under 20 lines"
  - "Feature components navigate via string paths, not Route object imports"

requirements-completed: [STRUCT-04, STRUCT-05]

# Metrics
duration: 6min
completed: 2026-03-09
---

# Phase 1 Plan 4: Feature Folder Completion and Route Thinning Summary

**Completed 6 feature folders and converted all route files to thin wrappers importing from src/features/, reducing route files by 1029 lines**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-09T09:27:23Z
- **Completed:** 2026-03-09T09:33:35Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Created 3 remaining feature folders (auth, onboarding, uploads) completing the 6-domain feature architecture
- Converted all 5 page route files and 1 -ui convention file to thin wrappers (all under 20 lines)
- Removed 1029 lines from route files by moving all JSX and logic to feature components
- All 153 tests pass with 100% coverage thresholds met

## Task Commits

Each task was committed atomically:

1. **Task 1: Create remaining feature folders (auth, onboarding, uploads)** - `987224a` (feat)
2. **Task 2: Convert all route files to thin wrappers** - `3a43f77` (feat)

## Files Created/Modified
- `src/features/onboarding/components/UsernamePage.tsx` - Extracted onboarding username form component
- `src/features/onboarding/index.ts` - Barrel export for UsernamePage
- `src/features/onboarding/onboarding.test.tsx` - 4 co-located onboarding tests
- `src/features/auth/index.ts` - Skeleton barrel export (auth UI minimal)
- `src/features/uploads/index.ts` - Skeleton barrel export (uploads embedded in other features)
- `src/routes/_app/_auth/dashboard/_layout.index.tsx` - Thin wrapper importing DashboardPage
- `src/routes/_app/_auth/dashboard/_layout.checkout.tsx` - Thin wrapper importing CheckoutPage
- `src/routes/_app/_auth/dashboard/_layout.settings.index.tsx` - Thin wrapper importing SettingsPage
- `src/routes/_app/_auth/dashboard/_layout.settings.billing.tsx` - Thin wrapper importing BillingSettings
- `src/routes/_app/_auth/onboarding/_layout.username.tsx` - Thin wrapper importing UsernamePage
- `src/routes/_app/_auth/dashboard/-ui.navigation.tsx` - Single re-export from @/features/dashboard
- `src/features/dashboard/components/Navigation.tsx` - Replaced Route.fullPath with string path constants
- `src/features/billing/components/CheckoutPage.tsx` - Replaced DashboardRoute.fullPath with "/dashboard"
- `vitest.config.ts` - Excluded barrel exports and Navigation from coverage

## Decisions Made
- Navigation component uses string path constants (`DASHBOARD_PATH`, `SETTINGS_PATH`, `BILLING_PATH`) instead of importing Route objects from route files, breaking the circular dependency between features and routes
- Coverage config excludes barrel exports (pure re-exports, no logic) and Navigation shell (complex Radix dropdown menus that were previously excluded as part of routes)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Navigation path constant naming collision**
- **Found during:** Task 2
- **Issue:** Replace-all of `SettingsRoute.fullPath` also partially replaced inside `BillingSettingsRoute.fullPath`, creating `BillingSETTINGS_PATH`
- **Fix:** Corrected to `BILLING_PATH`
- **Files modified:** src/features/dashboard/components/Navigation.tsx
- **Committed in:** 3a43f77

**2. [Rule 2 - Missing Critical] Updated coverage config for new feature files**
- **Found during:** Task 2
- **Issue:** Barrel exports (index.ts) and Navigation.tsx (previously excluded under src/routes/) now counted in coverage, causing threshold failures
- **Fix:** Added exclusions for barrel exports and Navigation shell component
- **Files modified:** vitest.config.ts
- **Committed in:** 3a43f77

**3. [Rule 3 - Blocking] Updated route test imports for removed default exports**
- **Found during:** Task 2
- **Issue:** Route test files imported default exports (Dashboard, DashboardCheckout, etc.) which no longer exist after thinning
- **Fix:** Changed imports to use named exports from feature folders
- **Files modified:** All 5 route test files
- **Committed in:** 3a43f77

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 feature folders complete with barrel exports
- All route files are thin wrappers (under 20 lines)
- Frontend architecture modernization structurally complete
- Ready for Plan 01-05 (plugin files) and Plan 01-06

---
*Phase: 01-architecture-modernization*
*Completed: 2026-03-09*
