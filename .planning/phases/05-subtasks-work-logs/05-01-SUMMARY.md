---
phase: 05-subtasks-work-logs
plan: 01
subsystem: backend
tags: [convex, zod, crud, cascade-delete, time-parser, generator]

requires:
  - phase: 03.2
    provides: CRUD generator pipeline
  - phase: 04
    provides: tasks and projects backend
provides:
  - Subtask CRUD with promote, reorder, toggleDone, cascade delete
  - Work log CRUD with ownership guards and time aggregation
  - Smart time parser utility (parseTimeInput, formatMinutes)
  - Schema tables for subtasks and workLogs
affects: [05-02, frontend, task-detail-panel]

tech-stack:
  added: []
  patterns: [cascade-delete, ownership-guard, time-parser]

key-files:
  created:
    - src/shared/schemas/subtasks.ts
    - src/shared/schemas/work-logs.ts
    - convex/subtasks/mutations.ts
    - convex/subtasks/queries.ts
    - convex/work-logs/mutations.ts
    - convex/work-logs/queries.ts
    - src/shared/utils/time-parser.ts
    - src/features/subtasks/subtasks.gen.yaml
    - src/features/work-logs/work-logs.gen.yaml
  modified:
    - convex/schema.ts
    - convex/tasks/mutations.ts
    - convex/projects/mutations.ts
    - src/shared/errors.ts
    - convex/_generated/api.d.ts

key-decisions:
  - "Used plain mutation (not zCustomMutation) for subtask/workLog create — simpler pattern since validation is minimal"
  - "Position uses Date.now() for auto-ordering (same pattern as tasks)"
  - "Promoted subtasks count as 'done' in completionCount"
  - "Removed generated standalone page/route/component files — subtasks and work logs are embedded in TaskDetailPanel"
  - "Work log ownership uses creatorId === userId check (not RBAC)"

patterns-established:
  - "Cascade delete pattern: parent deletes children via asyncMap before self-delete"
  - "Ownership guard pattern: check creatorId === userId, throw NOT_OWNER"
  - "Smart time parsing: flexible input ('30m', '1h30m', '1.5h', '90') → minutes"

requirements-completed: [SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06, SUB-07, WLOG-01, WLOG-02, WLOG-03, WLOG-04]

duration: 11min
completed: 2026-03-27
---

# Phase 5 Plan 1: Subtask & Work Log Backend Summary

**Subtask CRUD with promote/reorder/toggle, work log CRUD with ownership guards, cascade delete through tasks/projects, and smart time parser utility**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-27T09:25:49Z
- **Completed:** 2026-03-27T09:37:00Z
- **Tasks:** 9
- **Files modified:** 28

## Accomplishments
- Generated subtasks and workLogs entities via generator pipeline (validating Phase 03.2)
- Customized backend with domain-specific mutations: promote, toggleDone, reorder, ownership guards
- Cascade delete: task removal cascades to subtasks/workLogs, project removal cascades through tasks
- Smart time parser with 17 test cases covering all input formats
- 100% test coverage with 317 tests passing

## Task Commits

1. **Task 1-2: Scaffold via generator** - `3e7abc8` (feat)
2. **Task 3-5: Customize backend + time parser** - `51498fe` (feat)
3. **Task 6-8: Tests and cascade delete** - `a9d721f` (test)
4. **Task 9: Coverage fix and cleanup** - `0f3c1b3` (fix)

## Files Created/Modified
- `src/shared/schemas/subtasks.ts` - Zod schema with subtaskTitle, subtaskStatus
- `src/shared/schemas/work-logs.ts` - Zod schema with workLogBody, createWorkLogInput
- `convex/subtasks/mutations.ts` - create, update, remove, toggleDone, reorder, promote
- `convex/subtasks/queries.ts` - listByTask with completionCount
- `convex/work-logs/mutations.ts` - create, update, remove with ownership guards
- `convex/work-logs/queries.ts` - listByTask with totalMinutes aggregation
- `src/shared/utils/time-parser.ts` - parseTimeInput and formatMinutes
- `convex/tasks/mutations.ts` - cascade delete subtasks/workLogs
- `convex/projects/mutations.ts` - cascade delete through tasks to subtasks/workLogs
- `src/shared/errors.ts` - subtasks and workLogs error constants

## Decisions Made
- Used plain mutation for subtask create (simpler, no complex Zod validation needed)
- Promoted subtasks count as "done" in completionCount
- Removed all generator-created standalone pages/routes/components (subtasks and work logs are embedded in TaskDetailPanel)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Coverage gaps in branch coverage**
- **Found during:** Task 9 (Final verification)
- **Issue:** Three uncovered branches: subtask update without title, toggleDone NOT_FOUND, work-log remove NOT_FOUND
- **Fix:** Added 3 additional test cases to cover these branches
- **Files modified:** convex/subtasks/mutations.test.ts, convex/work-logs/mutations.test.ts
- **Verification:** `npm test -- --coverage` shows 100% on all thresholds
- **Committed in:** 0f3c1b3

**2. [Rule 3 - Blocking] Unused variable in test**
- **Found during:** Task 9 (typecheck)
- **Issue:** `userId` destructured but unused in promote test
- **Fix:** Removed unused destructure
- **Committed in:** 0f3c1b3

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for 100% coverage and clean typecheck.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend fully tested and ready for frontend integration in Plan 05-02
- All API types in api.d.ts for frontend consumption
- Time parser utility ready for WorkLogForm component

---
*Phase: 05-subtasks-work-logs*
*Completed: 2026-03-27*
