# Phase 5: Subtasks & Work Logs - Research

**Researched:** 2026-03-27
**Mode:** ecosystem
**Confidence:** High — all patterns exist in the codebase; this is incremental work

## Standard Stack

| Concern | Solution | Confidence |
|---------|----------|------------|
| Side panel / Sheet UI | `@radix-ui/react-dialog` (build Sheet from Dialog primitive) | High |
| Drag-reorder subtasks | `@dnd-kit/core` + `@dnd-kit/sortable` (already installed, pattern in TaskList) | High |
| Time parsing ("1h30m") | Custom utility function (~30 lines regex) | High |
| Backend validation | Zod v4 schemas + `zodToConvex()` + `zCustomMutation` (established) | High |
| Testing | `feather-testing-convex` + Vitest (established) | High |
| Code generation | `npx plop feature -- --yamlPath <yaml>` (Phase 03.2 generators) | High |

## Architecture Patterns

### Generator-First Workflow (D-19, D-20, D-21)

**CRITICAL: Every new entity MUST go through the generator pipeline first.**

1. Create `.gen.yaml` files for `subtasks` and `workLogs`
2. Run `npx plop feature -- --yamlPath <path>` to scaffold base CRUD
3. Customize generated output for domain-specific logic

This is not just scaffolding convenience — it validates the Phase 03.2 generators with real production entities. Bugs found feed back to template fixes.

**YAML structure** (reference: `src/features/tasks/tasks.gen.yaml`):
```yaml
name: subtasks
label: Subtask
labelPlural: Subtasks

fields:
  title:
    type: string
    required: true
    max: 200
  status:
    type: enum
    values: [todo, done, promoted]
    default: todo
  # ...

relationships:
  task:
    type: belongs_to
    target: tasks
    required: true
    column: taskId
```

**Generator output (what gets scaffolded):**
- `src/shared/schemas/subtasks.ts` — Zod schema
- `convex/subtasks/mutations.ts` — CRUD mutations
- `convex/subtasks/queries.ts` — Queries
- `convex/subtasks/mutations.test.ts` — Backend tests
- `convex/subtasks/queries.test.ts` — Backend tests
- `src/features/subtasks/` — Frontend components + barrel export
- `src/routes/_app/_auth/dashboard/_layout.subtasks.tsx` — Route
- Auto-wiring: `convex/schema.ts`, `src/shared/errors.ts`, `src/shared/nav.ts`, `src/i18n.ts`, locale files

**Post-scaffold customization needed:**
- Subtasks: add `position` field, `promotedToTaskId` field, `creatorId` field, promote mutation, reorder mutation, listByTask query (replace generated list-all query)
- WorkLogs: add `creatorId` field, `timeMinutes` optional field, listByTask query, ownership guards on update/delete, total time aggregation
- Side panel: entirely custom (not a generated page pattern)

### Data Model

**Subtasks table:**
```
subtasks:
  title: string (max 200)
  status: "todo" | "done" | "promoted"
  taskId: Id<"tasks"> (required, indexed)
  position: number (for drag-reorder, same pattern as tasks)
  promotedToTaskId: optional Id<"tasks"> (link to promoted task)
  creatorId: Id<"users">

  Indexes: by_task (taskId)
```

**WorkLogs table:**
```
workLogs:
  body: string (max 2000)
  timeMinutes: optional number (time spent in minutes)
  taskId: Id<"tasks"> (required, indexed)
  creatorId: Id<"users">

  Indexes: by_task (taskId)
```

### Side Panel (Task Detail Surface)

**Pattern:** Radix Dialog used as a Sheet (slide-from-right panel).

- Build `src/ui/sheet.tsx` from `@radix-ui/react-dialog` (Dialog.Root + Dialog.Portal + Dialog.Overlay + Dialog.Content with right-slide animation)
- This is the standard shadcn/ui pattern: Dialog primitive styled as a Sheet
- Panel width: ~50% viewport on desktop, full-width on mobile
- Close: click outside overlay + Escape key + explicit close button (all provided by Dialog primitive)
- URL reflects selected task: `/dashboard/tasks?taskId=<id>` via TanStack Router search params
- Task list remains visible and interactive behind the panel

**Component hierarchy:**
```
TaskDetailPanel (Sheet wrapper)
  ├── Header: task title (editable), status badge, priority, total time
  ├── Description (editable)
  ├── SubtaskList
  │   ├── Completion count ("3/5 done")
  │   ├── DndContext + SortableContext (same pattern as TaskList)
  │   ├── SubtaskItem (checkbox + title + promote button)
  │   └── InlineAddSubtask (text input + Enter to add)
  └── WorkLogSection
      ├── WorkLogForm (textarea + time input + submit)
      └── WorkLogList (entries with author, time, relative timestamp, description)
```

### Subtask Promotion Flow

1. User clicks promote button (⇗ icon) on a subtask
2. Mutation creates new task with subtask's title, inherits parent's projectId, status "todo"
3. Mutation patches subtask: status → "promoted", promotedToTaskId → new task ID
4. UI shows promoted subtask as visually distinct (muted, not toggleable, link icon to new task)

**Note:** The Kiro spec mentions `taskLinks` table with "spawned_from" relationship, but REQUIREMENTS.md for Phase 5 does NOT include task links (those are deferred to v3.0+ as LINK-01, LINK-02). The `promotedToTaskId` field on the subtask itself is sufficient for Phase 5.

### Smart Time Parsing

A utility function that accepts flexible time formats and returns minutes:
- `"30m"` → 30
- `"1h30m"` → 90
- `"1.5h"` → 90
- `"90"` → 90 (bare number defaults to minutes)
- `"2h"` → 120

Implementation: regex-based parser, ~30 lines. Pure function, easily unit-tested.

### Cascade Delete Updates

When a task is deleted (`tasks/mutations.ts remove`), also delete:
- All subtasks with that taskId
- All workLogs with that taskId

This requires updating the existing `remove` mutation in `convex/tasks/mutations.ts` to cascade.

Also update `convex/projects/mutations.ts remove` which currently cascades to tasks — those cascaded task deletions now also need to cascade to subtasks and work logs.

## Don't Hand-Roll

| Problem | Use Instead |
|---------|-------------|
| Sheet/side panel | Radix Dialog primitive styled as Sheet |
| Drag-reorder | dnd-kit (already in project) |
| Form validation | Zod schemas + zCustomMutation |
| Convex validators | zodToConvex() from convex-helpers |
| Auth guards | auth.getUserId(ctx) pattern |
| Optimistic updates | TanStack Query + Convex reactive queries (no manual optimistic updates needed) |

## Common Pitfalls

1. **Generator YAML field types matter** — Use `string` (not `text`) for title, `text` for long-form body, `enum` for status. Generator templates behave differently for each type.

2. **Coverage 100% threshold** — Every new file must be covered. The vitest config coverage.include glob `src/features/**/*.{ts,tsx}` and `convex/**/*.ts` will auto-capture new subtasks and workLogs files. Sheet component in `src/ui/` needs explicit glob addition to coverage config.

3. **Convex schema.ts is flat** — Subtasks and workLogs tables go at root level in `convex/schema.ts`, not nested. The generator handles this via wiring.

4. **api.d.ts manual update** — After adding tables to schema.ts, `convex/_generated/api.d.ts` needs updating. Without a running Convex backend, this must be done manually (established pattern from Phase 3).

5. **zCustomMutation vs plain mutation** — Use `zCustomMutation` for user-typed input (create subtask, create work log). Use plain `mutation` for simple ops like reorder, updateStatus where args are programmatic.

6. **Position field for ordering** — Use `Date.now()` for initial position (same as tasks). Reorder uses midpoint calculation between neighbors.

7. **Side panel URL sync** — Use TanStack Router search params (`?taskId=<id>`), not path params. This keeps the existing route structure intact — the panel opens on top of My Tasks, Team Pool, or Project Detail views without route changes.

8. **Promoted subtask is not toggleable** — A promoted subtask's checkbox should be disabled. It has status "promoted" which is neither "todo" nor "done".

9. **Work log ownership** — Only the creator can edit/delete their own work log entries. The `creatorId` field + auth guard enforces this.

10. **Cascade delete ordering** — Delete subtasks and work logs BEFORE deleting the task itself (foreign key integrity, even though Convex doesn't enforce FK constraints).

## Code Examples

### Subtask Zod Schema Pattern
```typescript
export const SUBTASK_STATUS_VALUES = ["todo", "done", "promoted"] as const;
export const subtaskStatus = z.enum(SUBTASK_STATUS_VALUES);
export type SubtaskStatus = z.infer<typeof subtaskStatus>;

export const SUBTASK_TITLE_MAX_LENGTH = 200;
export const subtaskTitle = z.string().min(1).max(SUBTASK_TITLE_MAX_LENGTH).trim();

export const createSubtaskInput = z.object({
  taskId: z.string(), // Will be validated as v.id("tasks") in Convex
  title: subtaskTitle,
});
```

### Work Log Zod Schema Pattern
```typescript
export const WORK_LOG_BODY_MAX_LENGTH = 2000;
export const workLogBody = z.string().min(1).max(WORK_LOG_BODY_MAX_LENGTH).trim();

export const createWorkLogInput = z.object({
  taskId: z.string(),
  body: workLogBody,
  timeMinutes: z.number().int().positive().optional(),
});
```

### Sheet Component Pattern (from Radix Dialog)
```typescript
import * as DialogPrimitive from "@radix-ui/react-dialog";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetContent = React.forwardRef<...>(({ children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />
    <DialogPrimitive.Content
      ref={ref}
      className="fixed inset-y-0 right-0 w-[50%] bg-card shadow-lg data-[state=open]:animate-slide-in-right"
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
```

### Time Parser Pattern
```typescript
export function parseTimeInput(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // "1h30m" or "1h 30m"
  const hm = trimmed.match(/^(\d+(?:\.\d+)?)\s*h\s*(?:(\d+)\s*m)?$/i);
  if (hm) return Math.round(parseFloat(hm[1]) * 60 + (parseInt(hm[2] || "0")));

  // "30m"
  const m = trimmed.match(/^(\d+)\s*m$/i);
  if (m) return parseInt(m[1]);

  // "1.5h"
  const h = trimmed.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (h) return Math.round(parseFloat(h[1]) * 60);

  // bare number defaults to minutes
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num > 0) return Math.round(num);

  return undefined;
}
```

### Promote Mutation Pattern
```typescript
export const promote = mutation({
  args: { subtaskId: v.id("subtasks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const subtask = await ctx.db.get(args.subtaskId);
    if (!subtask) throw new Error(ERRORS.subtasks.NOT_FOUND);
    if (subtask.status === "promoted") throw new Error(ERRORS.subtasks.ALREADY_PROMOTED);

    const parentTask = await ctx.db.get(subtask.taskId);

    // Create new full task from subtask
    const newTaskId = await ctx.db.insert("tasks", {
      title: subtask.title,
      status: "todo",
      visibility: "shared",
      priority: false,
      creatorId: userId,
      assigneeId: userId,
      projectId: parentTask?.projectId,
      position: Date.now(),
    });

    // Mark subtask as promoted with link
    await ctx.db.patch(args.subtaskId, {
      status: "promoted",
      promotedToTaskId: newTaskId,
    });

    return newTaskId;
  },
});
```

## Validation Architecture

### Testing Strategy

**Backend tests (Convex):**
- Subtask CRUD: create, update (title), remove, reorder, promote
- Work log CRUD: create, update (body, timeMinutes), remove
- Ownership guards: only creator can edit/delete work logs
- Auth guards: unauthenticated returns early
- Cascade delete: deleting task removes subtasks + work logs
- Promote: creates new task, updates subtask status, inherits projectId
- Edge cases: promote already-promoted subtask (error), delete promoted subtask

**Frontend tests:**
- TaskDetailPanel renders with task data
- SubtaskList renders checklist with completion count
- SubtaskItem checkbox toggles status
- Promoted subtask shows link icon, checkbox disabled
- WorkLogForm submits with body and optional time
- WorkLogList renders entries with formatted time
- Time parser utility: all format variants

**Integration points:**
- TaskItem click opens TaskDetailPanel (Sheet)
- URL search params sync with panel open/close
- Cascade delete from task remove
- Promote creates navigable task

### Verification Criteria
1. Generator pipeline produces working CRUD for both entities
2. All 11 requirement IDs (SUB-01..07, WLOG-01..04) have passing tests
3. 100% code coverage maintained
4. Side panel opens from My Tasks, Team Pool, and Project Detail views
5. Smart time parsing handles all documented formats
6. Subtask promotion creates valid task with correct inheritance

## Dependencies & Installation

**New npm packages:**
- `@radix-ui/react-dialog` — Sheet component foundation

**Already installed (no changes needed):**
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag-reorder
- `convex-helpers` — zCustomMutation, zodToConvex, asyncMap
- `zod` — validation schemas
- `lucide-react` — icons (Check, ArrowUpRight/SquareArrowOutUpRight for promote, Clock, X)

## RESEARCH COMPLETE

**Summary:** Phase 5 is incremental — all patterns already exist in the codebase. The main novelties are: (1) Sheet UI primitive from Radix Dialog, (2) smart time parsing utility, (3) subtask promotion mutation, and (4) generator-first workflow validation. No architectural unknowns.
