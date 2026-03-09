---
phase: 01-architecture-modernization
plan: 09
subsystem: api
tags: [zod, convex, validation, convex-helpers, zodToConvex, zCustomMutation]

requires:
  - phase: 01-architecture-modernization (01-01)
    provides: shared Zod schemas (username, billing)
provides:
  - Zod-validated Convex mutations via zCustomMutation
  - Convex schema validators derived from Zod schemas via zodToConvex
  - Single source of truth for validation across client and server
affects: [billing, onboarding, user-mutations]

tech-stack:
  added: []
  patterns: [zodToConvex for deriving Convex validators from Zod, zCustomMutation for Zod-validated mutations]

key-files:
  created: []
  modified:
    - convex/schema.ts
    - convex/users/mutations.ts
    - convex/onboarding/mutations.ts
    - src/shared/schemas/billing.ts

key-decisions:
  - "Only converted mutations with user-typed input (updateUsername, completeOnboarding) -- mutations using v.id() or no args left as regular mutation()"

patterns-established:
  - "zodToConvex pattern: import Zod schema from src/shared/schemas, pass to zodToConvex() for Convex validator"
  - "zCustomMutation pattern: create zMutation builder once per file, use for mutations needing Zod validation"

requirements-completed: [VAL-02, VAL-04]

duration: 2min
completed: 2026-03-09
---

# Phase 1 Plan 9: Zod Validation Wiring Summary

**Convex mutations validated via zCustomMutation with shared Zod schemas; schema validators derived from Zod via zodToConvex**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T12:54:34Z
- **Completed:** 2026-03-09T12:56:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Replaced manual v.union/v.literal definitions in convex/schema.ts with zodToConvex-derived validators for currency, interval, and planKey
- Converted updateUsername and completeOnboarding mutations to use zCustomMutation with Zod schema args
- Established src/shared/schemas/billing.ts as the acknowledged single source of truth for billing validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Derive Convex schema validators from Zod schemas via zodToConvex** - `44b5935` (feat)
2. **Task 2: Wire zCustomMutation into user and onboarding mutations** - `bb192bb` (feat)

## Files Created/Modified
- `convex/schema.ts` - Uses zodToConvex to derive currencyValidator, intervalValidator, planKeyValidator from Zod schemas
- `convex/users/mutations.ts` - updateUsername uses zCustomMutation with Zod username schema
- `convex/onboarding/mutations.ts` - completeOnboarding uses zCustomMutation with Zod username + currency schemas
- `src/shared/schemas/billing.ts` - Updated doc comment to reflect source-of-truth status

## Decisions Made
- Only converted mutations with user-typed input to zCustomMutation (updateUsername, completeOnboarding). Mutations using v.id("_storage") or no args (updateUserImage, removeUserImage, deleteCurrentUserAccount) left as regular mutation() since they don't benefit from Zod validation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- VAL-02 and VAL-04 gaps are now closed
- All billing and username validation flows use Zod as single source of truth
- Pattern established for converting additional mutations to zCustomMutation if needed

## Self-Check: PASSED

All 4 modified files exist. Both task commits verified (44b5935, bb192bb).

---
*Phase: 01-architecture-modernization*
*Completed: 2026-03-09*
