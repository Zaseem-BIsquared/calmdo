# Phase 5: Subtasks & Work Logs - Research

**Researched:** 2026-03-27

## Domain Analysis

Phase 5 introduces two new data entities (subtasks, work logs) and a new UI surface (task detail side panel). It builds on Phase 3 (tasks) and Phase 4 (projects) patterns.

### Scope

**In scope (from requirements):**
- SUB-01 through SUB-07: Subtask CRUD, reorder, promote, completion count
- WLOG-01 through WLOG-04: Work log CRUD, time tracking, total display
- Task detail side panel as the container surface

**Out of scope (Phase 6):**
- Activity logs / audit trail
- Task links (blocked_by) — only spawned_from via promotion
- Combined activity timeline
- Search and filters

## Data Model Findings

### Subtasks Table

From kiro-specs/05-task-details/design.md:

| Field | Type | Description |
|-------|------|-------------|
| taskId | Id<"tasks"> | Parent task |
| title | string | Subtask title |
| status | "todo" \| "done" \| "promoted" | Subtask status |
| position | number | Sort order (reuse Date.now() pattern from tasks) |
| assigneeId | Id<"users">? | Optional assignee (CONTEXT D-09) |
| promotedToTaskId | Id<"tasks">? | Link to promoted task |
| createdBy | Id<"users"> | Creator |

**Indexes needed:** `by_task` (taskId) for listing subtasks of a task.

No `createdAt` field needed since Convex provides `_creationTime` on all documents.

### Work Logs Table

From kiro-specs/06-work-tracking/design.md:

| Field | Type | Description |
|-------|------|-------------|
| taskId | Id<"tasks"> | Parent task |
| body | string | Work description |
| timeMinutes | number? | Optional time spent |
| createdBy | Id<"users"> | Creator |

**Indexes needed:** `by_task` (taskId) for listing work logs of a task.

Again, `_creationTime` provides timestamp — no need for custom `createdAt`.

### Schema Impact

Two new tables in `convex/schema.ts`. Both use `taskId` as foreign key. Cascade delete from tasks.remove must be updated to also delete subtasks and work logs.

The `orgId` field from the kiro spec is skipped — the project is user-scoped (v2.0 decision: no org layer).

## Existing Patterns to Reuse

### Backend Patterns

1. **Zod schemas** in `src/shared/schemas/` → `zodToConvex()` in schema.ts
2. **zCustomMutation** for user-typed input (create/update with validation)
3. **Plain mutation** for simple ops (remove, reorder, updateStatus)
4. **Auth guard:** `auth.getUserId(ctx)` at top of every mutation/query
5. **Error constants** in `src/shared/errors.ts`
6. **Reorder pattern:** `position: v.number()` with Date.now() for initial, midpoint calculation for drag
7. **Cascade delete:** Pattern from projects.remove (query children, asyncMap delete, then delete parent)

### Frontend Patterns

1. **Feature folder:** `src/features/{name}/components/`, `hooks/`, `index.ts`
2. **TaskItem.tsx** — existing list item component (will need onClick handler for panel open)
3. **TaskList.tsx** — drag-reorder via dnd-kit (reuse for subtask reorder)
4. **TaskForm.tsx** — inline create form (reuse pattern for subtask add and work log form)
5. **TaskStatusBadge.tsx** — status badge with transitions
6. **useDoubleCheck** — delete confirmation hook
7. **Route structure:** TanStack Router file-based routes
8. **i18n:** `useTranslation` with namespace per feature

### Key Integration Points

1. **TaskItem click** → opens side panel (currently title click enters edit mode — needs redesign)
2. **URL update** → `/dashboard/tasks/:taskId` for deep linking (CONTEXT D-03)
3. **Side panel** → slides from right, task list visible behind (CONTEXT D-01, D-02)
4. **Cascade delete** — task deletion must also delete subtasks and work logs

## Technical Approach

### Plan 1: Backend — Schemas, Tables, Mutations, Queries

**Subtasks domain:**
- Zod schema: `src/shared/schemas/subtasks.ts` with status enum, title validator, create/update inputs
- Schema table in `convex/schema.ts` with indexes
- `convex/subtasks/mutations.ts`: create, update, remove, reorder, promote
- `convex/subtasks/queries.ts`: listByTask (with completion count)

**Work logs domain:**
- Zod schema: `src/shared/schemas/workLogs.ts` with body validator, time validator, create/update inputs
- Schema table in `convex/schema.ts` with indexes
- `convex/workLogs/mutations.ts`: create, update, remove (own entries only)
- `convex/workLogs/queries.ts`: listByTask (with total time)

**Cascade updates:**
- Update `tasks.remove` to also delete subtasks and work logs
- Update `projects.remove` to cascade through tasks → subtasks + work logs

**Wiring:**
- Error constants in `src/shared/errors.ts`

### Plan 2: Frontend — Task Detail Panel, Subtask UI, Work Log UI

**Task detail panel:**
- New `TaskDetailPanel.tsx` component — side panel/drawer sliding from right
- Radix Dialog (or Sheet) for the overlay behavior
- Route with param: `/dashboard/tasks/:taskId` updates URL but keeps list visible

**Subtask UI (inside panel):**
- Completion count header: "3/5 done"
- Checklist with checkbox, title, optional assignee indicator
- Drag-to-reorder (reuse dnd-kit pattern)
- Inline add input at bottom
- Promote action per subtask
- Promoted subtask visual treatment (muted, link icon)

**Work log UI (inside panel):**
- Total time in panel header
- Inline form: textarea + time input + submit button
- Smart time parsing (30m, 1h30m, 1.5h, 90)
- Work log entry list: author, formatted time, relative timestamp, description
- Edit/delete own entries

**i18n:**
- New namespaces: `subtasks`, `workLogs`
- Translation files for en/es

## Risk Assessment

### Low Risk
- Subtask CRUD — straightforward pattern, mirrors tasks
- Work log CRUD — simple data entry
- Cascade delete — established pattern from projects

### Medium Risk
- Task detail panel — new UI surface, needs URL sync with TanStack Router
- TaskItem click behavior change — currently title click enters edit mode, need to move that into panel
- Smart time parsing — regex-based, needs thorough test coverage

### Mitigations
- Use Radix Sheet/Dialog primitive for panel behavior (battle-tested)
- TanStack Router supports route params natively — `/dashboard/tasks/$taskId`
- Inline edit moves to panel (title editable in panel, not in list item)

## Dependencies

- **Phase 3 (tasks)** — Must be complete (it is)
- **Phase 4 (projects)** — Not strictly required but cascade delete needs updating
- **dnd-kit** — Already installed for task reorder
- **Radix UI** — Already used for Select, Dialog — need Sheet for panel

## RESEARCH COMPLETE
