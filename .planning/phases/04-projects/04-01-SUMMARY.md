---
phase: 04-projects
plan: 01
subsystem: database, api
tags: [convex, zod, crud, projects, cascade-delete]

requires:
  - phase: 03-tasks
    provides: Task mutations, queries, schema, test patterns
provides:
  - Project Zod schemas (status, name, inputs)
  - Projects Convex table with indexes (by_status, by_creator)
  - by_project index on tasks table
  - Project CRUD mutations (create, update, remove with cascade delete)
  - Project queries (list with status filter + taskCounts, getWithTasks with statusSummary)
  - Task mutations: createInProject, assignToProject with visibility auto-flip
affects: [04-02-frontend, phase-5-subtasks]

tech-stack:
  added: []
  patterns: [cascade delete via asyncMap, project-task relationship with by_project index]

key-files:
  created:
    - src/shared/schemas/projects.ts
    - convex/projects/mutations.ts
    - convex/projects/queries.ts
    - convex/projects/mutations.test.ts
    - convex/projects/queries.test.ts
  modified:
    - src/shared/errors.ts
    - convex/schema.ts
    - convex/tasks/mutations.ts
    - convex/tasks/mutations.test.ts
    - convex/_generated/api.d.ts

key-decisions:
  - "Used separate createInProject mutation instead of extending existing create (keeps Zod schemas clean, avoids cross-entity coupling)"
  - "Used separate assignToProject mutation for project-task linking (cleaner than polluting task update args)"
  - "Visibility auto-flip on project removal: private if creator=assignee, shared otherwise (per D-07)"

patterns-established:
  - "Cascade delete pattern: query by index, asyncMap delete all, then delete parent"
  - "Cross-entity mutation pattern: separate mutation per relationship operation"

requirements-completed: [PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, PROJ-07]

duration: 4min
completed: 2026-03-27
---

# Phase 04 Plan 01: Project Backend Summary

**Project CRUD backend with Zod schemas, Convex table, cascade delete, status-filtered list with task counts, and task-project relationship mutations with visibility auto-flip**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-27T04:09:44Z
- **Completed:** 2026-03-27T04:14:17Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Complete project data layer: Zod schemas, Convex table with by_status/by_creator indexes
- CRUD mutations with auth guards, cascade delete removing all project tasks
- List query with optional status filter returning enriched taskCounts per project
- Detail query returning project with tasks array and statusSummary
- Task extensions: createInProject (shared visibility) and assignToProject (visibility auto-flip)
- 54 backend tests all passing, 100% coverage maintained

## Task Commits

Each task was committed atomically:

1. **Task 1: Project schemas, Convex table, and all backend functions** - `3376a69` (feat)
2. **Task 2: Extend task mutations with projectId and visibility auto-flip** - `bdafcc8` (feat)

## Files Created/Modified
- `src/shared/schemas/projects.ts` - Zod schemas for project status, name, create/update inputs
- `src/shared/errors.ts` - Added projects.NOT_FOUND error constant
- `convex/schema.ts` - Projects table + by_project index on tasks
- `convex/projects/mutations.ts` - create, update, remove (cascade) mutations
- `convex/projects/queries.ts` - list (status filter + taskCounts), getWithTasks (tasks + statusSummary)
- `convex/projects/mutations.test.ts` - 9 mutation tests
- `convex/projects/queries.test.ts` - 7 query tests
- `convex/tasks/mutations.ts` - Added createInProject and assignToProject mutations
- `convex/tasks/mutations.test.ts` - Added 7 tests for new mutations
- `convex/_generated/api.d.ts` - Added project type declarations

## Decisions Made
- Used separate createInProject mutation instead of extending existing create (keeps Zod schemas clean, avoids cross-entity coupling)
- Used separate assignToProject mutation for project-task linking (cleaner than polluting task update args)
- Visibility auto-flip on project removal: private if creator=assignee, shared otherwise (per D-07)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All backend APIs ready for frontend consumption in Plan 02
- api.projects.mutations.create/update/remove available
- api.projects.queries.list/getWithTasks available
- api.tasks.mutations.createInProject/assignToProject available

---
*Phase: 04-projects*
*Completed: 2026-03-27*
