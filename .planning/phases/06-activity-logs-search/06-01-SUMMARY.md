---
phase: 06-activity-logs-search
plan: 01
subsystem: database
tags: [convex, activity-logs, audit-trail, timeline, zod]

requires:
  - phase: 05-subtasks-work-logs
    provides: subtasks mutations, work logs queries, workLogs table
  - phase: 03.2-crud-generators
    provides: generator pipeline for scaffolding entities
provides:
  - activityLogs table with entity/actor indexes
  - logActivity helper for inline audit logging from any mutation
  - listByEntity query for entity-specific activity history
  - taskTimeline query merging activities + work logs chronologically
affects: [search, frontend-timeline-ui]

tech-stack:
  added: []
  patterns: [inline-activity-logging, timeline-merge-query, helper-function-pattern]

key-files:
  created:
    - convex/activity-logs/helpers.ts
    - convex/activity-logs/queries.ts
    - convex/activity-logs/mutations.ts
    - src/shared/schemas/activity-logs.ts
    - src/features/activity-logs/activity-logs.gen.yaml
    - public/locales/en/activity-logs.json
    - public/locales/es/activity-logs.json
  modified:
    - convex/schema.ts
    - convex/tasks/mutations.ts
    - convex/projects/mutations.ts
    - convex/subtasks/mutations.ts
    - convex/_generated/api.d.ts
    - src/shared/errors.ts
    - src/i18n.ts
    - src/shared/nav.ts
    - vitest.config.ts

key-decisions:
  - "Used camelCase activityLogs table name (matching workLogs, devEmails conventions)"
  - "entityId is v.string() not v.id() because it references multiple table types"
  - "No user-facing mutations — activity logs created only via logActivity helper"
  - "Removed generated frontend components, route, and nav entry (activity logs are inline, not standalone page)"
  - "metadata stored as JSON.stringify string, parsed back in timeline query"

patterns-established:
  - "Inline activity logging: import logActivity from helpers, call after mutation succeeds"
  - "Helper function pattern: domain helper in convex/{entity}/helpers.ts used by other domain mutations"
  - "Timeline merge pattern: query multiple tables, normalize to common shape with type discriminator, sort by _creationTime"

requirements-completed: [ACTV-01, ACTV-02, ACTV-03, ACTV-04]

duration: 13min
completed: 2026-03-27
---

# Phase 06 Plan 01: Activity Logs Backend & Inline Logging Summary

**logActivity helper with inline audit logging across all task/project/subtask mutations, plus taskTimeline merge query combining activity logs and work logs**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-27T10:52:47Z
- **Completed:** 2026-03-27T11:05:55Z
- **Tasks:** 9
- **Files modified:** 20

## Accomplishments
- Scaffolded activityLogs entity via generator pipeline (third production entity validating Phase 03.2)
- Created logActivity helper that any mutation can call with entity type, ID, action, actor, and optional metadata
- Added inline activity logging to 7 task mutations, 3 project mutations, and 3 subtask mutations
- Built listByEntity and taskTimeline queries with merged activity + work log timeline sorted newest first
- 320 tests pass at 100% coverage across all thresholds

## Task Commits

All tasks committed atomically in a single commit:

1. **Tasks 01-09: Activity Logs Backend & Inline Logging** - `9321f18`

**Plan metadata:** pending (docs commit)

## Files Created/Modified
- `convex/activity-logs/helpers.ts` - logActivity helper function
- `convex/activity-logs/queries.ts` - listByEntity and taskTimeline queries
- `convex/activity-logs/mutations.ts` - Empty (no user-facing mutations)
- `src/shared/schemas/activity-logs.ts` - Zod enums for entityType and action
- `convex/schema.ts` - activityLogs table with by_entity and by_actor indexes
- `convex/tasks/mutations.ts` - Inline logging in create, update, remove, updateStatus, assign, createInProject, assignToProject
- `convex/projects/mutations.ts` - Inline logging in create, update, remove
- `convex/subtasks/mutations.ts` - Inline logging in create, toggleDone, promote
- `convex/activity-logs/queries.test.ts` - 11 tests for listByEntity and taskTimeline
- `convex/tasks/mutations.test.ts` - 6 new activity log assertions
- `convex/projects/mutations.test.ts` - 4 new activity log assertions
- `convex/subtasks/mutations.test.ts` - 3 new activity log assertions

## Decisions Made
- Used camelCase `activityLogs` table name (matching `workLogs`, `devEmails` conventions) instead of generator's `"activity-logs"` quoted key
- `entityId` is `v.string()` because it references multiple table types (tasks, projects, subtasks)
- No user-facing mutations — logs created only via helper from other mutations
- Removed generated frontend components, route file, and nav entry (activity logs don't have a standalone page)
- metadata stored as `JSON.stringify` string, parsed back in timeline query

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Generator output cleanup**
- **Found during:** Task 1 (generator run)
- **Issue:** Generator created frontend components, route file, nav entry, and CRUD mutations that are not needed for activity logs
- **Fix:** Removed generated route file, nav entry, frontend components; replaced CRUD mutations with empty file
- **Files modified:** src/shared/nav.ts, convex/activity-logs/mutations.ts, vitest.config.ts
- **Verification:** nav.ts has no activity-logs entry, no route file exists

**2. [Rule 1 - Bug] Coverage configuration**
- **Found during:** Task 9 (verification)
- **Issue:** Comment-only mutations.ts counted as 0% coverage; subtask metadata ternary branch not covered
- **Fix:** Excluded mutations.ts from coverage; added promote test for subtask metadata coverage; added no-op update test for task edit branch
- **Files modified:** vitest.config.ts, queries.test.ts, mutations.test.ts
- **Verification:** 100% coverage on all thresholds

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Activity logging backend complete, ready for search/filter frontend work
- taskTimeline query ready for UI consumption
- All 13 entity mutations now produce activity log entries

---
*Phase: 06-activity-logs-search*
*Completed: 2026-03-27*
