# Phase 4: Projects - Research

**Researched:** 2026-03-10
**Domain:** Project CRUD, cascade delete, project-task relationship, filtered list views, Convex backend + React frontend
**Confidence:** HIGH

## Summary

Phase 4 adds the `projects` entity as a second vertical slice following the exact same pattern established by Phase 3 (Tasks). A project has a name and status lifecycle (active/on_hold/completed/archived). The project-task relationship is optional (tasks have a `projectId` field added in Phase 3). The main new challenges beyond basic CRUD are: (1) cascade delete -- deleting a project must delete all its tasks and (in future) work logs, (2) task counts per project in the projects list view, and (3) a project detail view that reuses task list components with project-scoped filters and a status summary bar.

Since the tasks entity already exists from Phase 3 with `projectId: v.optional(v.id("projects"))`, Phase 4 adds the `projects` table, creates project CRUD mutations, extends task mutations with "assign to project" functionality, and builds two new views (Projects List, Project Detail). The frontend can heavily reuse TaskList/TaskItem components from Phase 3. No new npm dependencies are required.

**Primary recommendation:** Follow the entity creation pattern exactly. Use `asyncMap` from convex-helpers for cascade delete. Keep task counts as simple collected queries (no aggregate component -- this is a small-team tool). Reuse Phase 3's task list components inside the project detail view.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROJ-01 | Create project with name and status (default: active) | Zod schema + zCustomMutation; 4-value status enum |
| PROJ-02 | Edit project name and status | zCustomMutation with partial update pattern (same as task edit) |
| PROJ-03 | Delete project cascades to tasks and work logs | asyncMap cascade: query tasks by_project index, delete each; work logs deferred to Phase 5 |
| PROJ-04 | View projects list filtered by status with task counts | Convex query with by_status index + collect tasks per project for counts |
| PROJ-05 | Assign task to project (optional) | Extend existing task update mutation to accept projectId; index by_project on tasks |
| PROJ-06 | View tasks within project filtered by status/assignee/priority | Query tasks by_project index, filter in JS for secondary criteria |
| PROJ-07 | Project view shows task count by status | Collect project tasks, group by status in query handler or frontend |
| VIEW-03 | Projects List view | Route + feature page component with status filter tabs |
| VIEW-04 | Project Detail view | Route with projectId param + task list with filters + summary bar |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | ^1.32.0 | Backend database + real-time queries | Project's backend |
| convex-helpers | ^0.1.114 | `zCustomMutation`, `zodToConvex`, `asyncMap` | Zod4-validated mutations + cascade delete utility |
| zod | ^4.3.6 | Schema definitions | Single source of truth for validation |
| @tanstack/react-query | ^5.90.21 | Frontend data fetching | `convexQuery` wrapper |
| @tanstack/react-form | ^1.28.4 | Form state + validation | Project standard for forms |
| @tanstack/react-router | ^1.166.3 | Routing with params | File-based routes, projectId param |
| lucide-react | ^0.577.0 | Icons | Already used throughout |

### New Dependencies
None required. Phase 4 uses only existing libraries.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple .collect() for task counts | @convex-dev/aggregate component | Overkill for small-team tool; aggregate adds complexity for O(log N) reads but N is small here |
| asyncMap cascade delete | Convex Ents library | Ents provides managed relationships but adds a new abstraction layer; asyncMap is already used in the project and cascade is simple |
| JS filtering for secondary task criteria | Multiple compound Convex indexes | Diminishing returns; project tasks are a bounded set, JS filter on collected results is efficient enough |

## Architecture Patterns

### Recommended Project Structure
```
src/shared/schemas/
  projects.ts                   # Zod schemas: projectStatus, createProject, updateProject

convex/
  schema.ts                     # Add projects table with zodToConvex validators
  projects/
    queries.ts                  # list (with status filter), getById (with task counts/summary)
    mutations.ts                # create, update, delete (cascade)
    queries.test.ts             # Backend query tests
    mutations.test.ts           # Backend mutation tests

src/features/projects/
  components/
    ProjectsPage.tsx            # Projects list page (VIEW-03)
    ProjectDetailPage.tsx       # Project detail with task list (VIEW-04)
    ProjectForm.tsx             # Create/edit project form (inline or modal)
    ProjectCard.tsx             # Project row in list (name, status badge, task counts)
    ProjectStatusBadge.tsx      # Status indicator with color coding
    TaskSummaryBar.tsx          # Horizontal bar showing task counts by status
  hooks/
    index.ts                    # Project-specific hooks if needed
  index.ts                      # Barrel exports
  projects.test.tsx             # Frontend component tests

src/routes/_app/_auth/dashboard/
  _layout.projects.index.tsx    # Projects list route (thin wrapper)
  _layout.projects.$projectId.tsx  # Project detail route with param (thin wrapper)
```

### Pattern 1: Project Schema with Status Enum
**What:** Define the projects table with a 4-value status enum and indexes for filtering.
**When to use:** Always for this phase.
**Example:**
```typescript
// src/shared/schemas/projects.ts
import { z } from "zod";

export const PROJECT_STATUS_VALUES = ["active", "on_hold", "completed", "archived"] as const;
export const projectStatus = z.enum(PROJECT_STATUS_VALUES);
export type ProjectStatus = z.infer<typeof projectStatus>;

export const PROJECT_NAME_MAX_LENGTH = 100;
export const projectName = z.string().min(1).max(PROJECT_NAME_MAX_LENGTH).trim();

export const createProjectInput = z.object({
  name: projectName,
});

export const updateProjectInput = z.object({
  name: projectName.optional(),
  status: projectStatus.optional(),
});
```

```typescript
// convex/schema.ts addition
projects: defineTable({
  name: v.string(),
  status: zodToConvex(projectStatusSchema),  // "active" | "on_hold" | "completed" | "archived"
  creatorId: v.id("users"),
})
  .index("by_status", ["status"])
  .index("by_creator", ["creatorId"])
```

### Pattern 2: Cascade Delete with asyncMap
**What:** When deleting a project, query all tasks with that projectId and delete them. Use `asyncMap` from convex-helpers (already used in the project for auth account cleanup).
**When to use:** PROJ-03.
**Example:**
```typescript
// convex/projects/mutations.ts
import { asyncMap } from "convex-helpers";

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Cascade: delete all tasks belonging to this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    await asyncMap(tasks, async (task) => {
      await ctx.db.delete(task._id);
    });

    // Delete the project itself
    await ctx.db.delete(args.projectId);
  },
});
```

**Important:** Phase 3 must add a `by_project` index on the tasks table: `.index("by_project", ["projectId"])`. If Phase 3 didn't include this, Phase 4's first task must add it.

### Pattern 3: Projects List with Task Counts
**What:** Query projects filtered by status, then for each project count tasks by status.
**When to use:** PROJ-04, PROJ-07, VIEW-03.
**Example:**
```typescript
// convex/projects/queries.ts
export const list = query({
  args: { status: v.optional(v.string()) },  // filter by project status
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    let projects;
    if (args.status) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .collect();
    } else {
      projects = await ctx.db.query("projects").collect();
    }

    // Enrich with task counts
    return asyncMap(projects, async (project) => {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();

      const taskCounts = {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === "todo").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
        done: tasks.filter((t) => t.status === "done").length,
      };

      return { ...project, taskCounts };
    });
  },
});
```

### Pattern 4: Project Detail with Task Filters
**What:** Query all tasks for a project, return them along with status summary. Filtering by status/assignee/priority can be done in JS on the collected results.
**When to use:** PROJ-06, VIEW-04.
**Example:**
```typescript
// convex/projects/queries.ts
export const getWithTasks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const statusSummary = {
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };

    return { ...project, tasks, statusSummary };
  },
});
```

Frontend filters (status/assignee/priority) are applied client-side on the `tasks` array since all tasks for a project are already loaded for the summary bar.

### Pattern 5: Task Assignment to Project
**What:** Extend the task update/create flow to accept an optional projectId.
**When to use:** PROJ-05.
**Example:**
```typescript
// This is an extension of the existing task mutations from Phase 3.
// The task's create and update mutations should already accept projectId
// as an optional field. Phase 4 adds the UI to select a project.

// If not already present in Phase 3's create mutation:
export const assignToProject = mutation({
  args: {
    taskId: v.id("tasks"),
    projectId: v.optional(v.id("projects")),  // null to unassign
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;
    await ctx.db.patch(args.taskId, { projectId: args.projectId });
  },
});
```

### Pattern 6: Route with Path Parameter
**What:** TanStack Router route that captures projectId from URL.
**When to use:** VIEW-04 (Project Detail).
**Example:**
```typescript
// src/routes/_app/_auth/dashboard/_layout.projects.$projectId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailPage } from "@/features/projects";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/_layout/projects/$projectId"
)({
  component: ProjectDetailPage,
});

// In ProjectDetailPage:
// const { projectId } = Route.useParams();
// Pass projectId as Convex Id<"projects"> to query
```

### Anti-Patterns to Avoid
- **Don't create separate mutations for each status transition:** Unlike tasks which have a linear workflow (todo -> in_progress -> done), projects can move freely between any status. Use a single `update` mutation that accepts any valid status.
- **Don't denormalize task counts on the project document:** Keeping task counts as a stored field requires updating the project on every task create/delete/status change. For a small-team tool, computing counts at query time is simpler and avoids consistency bugs.
- **Don't build a separate "assign to project" UI when edit-task form can include a project dropdown:** Reuse the task form's optional project field rather than building a separate assignment flow.
- **Don't fetch all tasks client-side for counting:** Compute counts in the Convex query handler so the client gets enriched project objects.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cascade delete | Manual recursive delete logic | `asyncMap` from convex-helpers | Already used in project for auth cleanup; handles async iteration cleanly |
| Status badge colors | Custom CSS per status | Reusable StatusBadge component with color map | Used for both project status and task status; DRY |
| Form validation | Manual onChange + state | @tanstack/react-form + Zod validators | Project standard, consistent with existing forms |
| Real-time data sync | Manual refetch/polling | Convex reactive queries via `convexQuery` | Built-in real-time; queries auto-update when tasks change |
| Aggregate counts | Custom counter tables | Simple `.collect()` + `.length` | N is small (small team, bounded tasks per project); no need for aggregate component |

**Key insight:** Phase 4 introduces no new technical problems. Every pattern (CRUD, cascade delete, filtered queries, parameterized routes) has a direct precedent in the existing codebase or Phase 3.

## Common Pitfalls

### Pitfall 1: Cascade Delete Must Also Handle Future Work Logs
**What goes wrong:** PROJ-03 says "delete cascades to its tasks and work logs." If Phase 4 only cascades to tasks but Phase 5 adds work logs, the cascade is incomplete.
**Why it happens:** Work logs don't exist yet (Phase 5). But the cascade must be designed for extensibility.
**How to avoid:** Implement cascade delete as: delete work logs for project's tasks (if table exists) -> delete tasks -> delete project. For now, the work logs step can be a commented placeholder or skipped since the table doesn't exist yet. The critical design is: cascade through tasks first, then delete project. When Phase 5 adds work logs, they'll need their own cascade (per-task work logs deleted when task is deleted).
**Warning signs:** Orphaned work log records after project deletion.

### Pitfall 2: by_project Index Must Exist on Tasks Table
**What goes wrong:** Phase 4 queries tasks by projectId but the index doesn't exist.
**Why it happens:** Phase 3 research planned `projectId` as an optional field but may not have added a `by_project` index since it wasn't needed for Phase 3's views.
**How to avoid:** Phase 4's first task must verify the `by_project` index exists on the tasks table. If not, add it: `.index("by_project", ["projectId"])`. Without this index, all project-task queries do full table scans.
**Warning signs:** Queries work in dev (few records) but degrade with more data.

### Pitfall 3: Optional projectId in Convex Index Queries
**What goes wrong:** Querying `.withIndex("by_project", (q) => q.eq("projectId", args.projectId))` when `projectId` is `undefined` returns nothing (not all tasks without a project).
**Why it happens:** Convex indexes don't match `undefined` values with `.eq()`. Documents with `projectId: undefined` are not indexed in the same way.
**How to avoid:** For "tasks without a project" queries, don't use the by_project index. Use a different approach: query all tasks and filter `!t.projectId`, or use a dedicated index if needed. The by_project index is specifically for "tasks IN a project" queries.
**Warning signs:** Missing tasks in views, tasks "disappearing" when unassigned from a project.

### Pitfall 4: Route Naming for Nested Project Routes
**What goes wrong:** TanStack Router doesn't pick up the project detail route or the route conflicts with the projects list.
**Why it happens:** File-based routing requires specific naming conventions. `_layout.projects.tsx` would create a layout, not a page.
**How to avoid:** Use `_layout.projects.index.tsx` for the list and `_layout.projects.$projectId.tsx` for the detail. The `$projectId` creates a dynamic segment. Check the existing `_layout.settings.index.tsx` and `_layout.settings.tsx` pattern for reference -- settings uses a layout with a nested index.
**Warning signs:** 404 on `/dashboard/projects/abc123`, or project detail renders inside wrong layout.

### Pitfall 5: Project Status Filter as URL State
**What goes wrong:** User filters projects by "active," navigates to a project detail, goes back, and the filter is lost.
**Why it happens:** Filter state stored only in React state resets on navigation.
**How to avoid:** Store the status filter as a search param in the URL: `/dashboard/projects?status=active`. TanStack Router supports search params natively. This preserves filter state across navigation and makes filtered views shareable/bookmarkable.
**Warning signs:** Filters reset on back-navigation, users re-applying filters repeatedly.

### Pitfall 6: Auth Guard Consistency
**What goes wrong:** Mutations throw errors instead of returning silently when unauthenticated.
**Why it happens:** Inconsistent with existing project pattern.
**How to avoid:** Follow existing pattern exactly: `if (!userId) return;` for mutations, `return []` or `return null` for queries. Never throw on unauthenticated.
**Warning signs:** Unhandled promise rejections in the frontend.

## Code Examples

### Zod Schema (matching project conventions)
```typescript
// src/shared/schemas/projects.ts
import { z } from "zod";

export const PROJECT_STATUS_VALUES = ["active", "on_hold", "completed", "archived"] as const;
export const projectStatus = z.enum(PROJECT_STATUS_VALUES);
export type ProjectStatus = z.infer<typeof projectStatus>;

export const PROJECT_NAME_MAX_LENGTH = 100;
export const projectName = z.string().min(1).max(PROJECT_NAME_MAX_LENGTH).trim();

export const createProjectInput = z.object({
  name: projectName,
});

export const updateProjectInput = z.object({
  name: projectName.optional(),
  status: projectStatus.optional(),
});
```

### Backend Test Pattern (matching convex-test conventions)
```typescript
// convex/projects/mutations.test.ts
import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { test } from "../test.setup";

describe("create", () => {
  test("creates a project with default active status", async ({ client, userId, testClient }) => {
    await client.mutation(api.projects.mutations.create, { name: "My Project" });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect()
    );
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("My Project");
    expect(projects[0].status).toBe("active");
    expect(projects[0].creatorId).toBe(userId);
  });
});

describe("delete", () => {
  test("cascade deletes project tasks", async ({ client, userId, testClient }) => {
    // Create project
    const projectId = await client.mutation(api.projects.mutations.create, { name: "Project" });

    // Create tasks in the project (via testClient to seed data)
    await testClient.run(async (ctx: any) => {
      await ctx.db.insert("tasks", {
        title: "Task 1", projectId, creatorId: userId,
        status: "todo", visibility: "shared", priority: false, position: 1000,
      });
      await ctx.db.insert("tasks", {
        title: "Task 2", projectId, creatorId: userId,
        status: "done", visibility: "shared", priority: false, position: 2000,
      });
    });

    await client.mutation(api.projects.mutations.delete, { projectId });

    const projects = await testClient.run(async (ctx: any) => ctx.db.query("projects").collect());
    const tasks = await testClient.run(async (ctx: any) => ctx.db.query("tasks").collect());
    expect(projects).toHaveLength(0);
    expect(tasks).toHaveLength(0);
  });
});
```

### Frontend Query + Status Filter Pattern
```typescript
// In ProjectsPage component
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "~/convex/_generated/api";

// Read status filter from URL search params
const { status } = Route.useSearch();
const { data: projects = [] } = useQuery(
  convexQuery(api.projects.queries.list, { status: status || undefined })
);

// Each project in the list has taskCounts: { total, todo, in_progress, done }
```

### Status Summary Bar Pattern
```typescript
// src/features/projects/components/TaskSummaryBar.tsx
interface TaskSummaryBarProps {
  counts: { todo: number; in_progress: number; done: number };
}

function TaskSummaryBar({ counts }: TaskSummaryBarProps) {
  const total = counts.todo + counts.in_progress + counts.done;
  if (total === 0) return null;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="bg-blue-500" style={{ width: `${(counts.todo / total) * 100}%` }} />
      <div className="bg-yellow-500" style={{ width: `${(counts.in_progress / total) * 100}%` }} />
      <div className="bg-green-500" style={{ width: `${(counts.done / total) * 100}%` }} />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Denormalized count fields | Compute-at-query-time (small scale) or Aggregate component (large scale) | Ongoing Convex pattern | Don't store counts; compute them |
| Convex Ents for relationships | Direct queries with indexes + asyncMap for cascade | Project convention | Lighter weight, no extra abstraction |
| convex-helpers Zod v1-3 | convex-helpers/server/zod4 | With Zod 4 | Project already uses zod4 path |

**Deprecated/outdated:**
- Storing aggregate counts on parent documents: Leads to consistency bugs in real-time systems
- Using Convex Ents for simple one-to-many relationships: Adds unnecessary abstraction when the relationship is straightforward

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0 + convex-test (backend) / Testing Library (frontend) |
| Config file | vitest implicit config in package.json (`npm test` -> `vitest run`) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` (includes coverage) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROJ-01 | Create project with name, default active status | unit | `npx vitest run convex/projects/mutations.test.ts -t "create" -x` | Wave 0 |
| PROJ-02 | Edit project name and status | unit | `npx vitest run convex/projects/mutations.test.ts -t "update" -x` | Wave 0 |
| PROJ-03 | Delete project cascades to tasks | unit | `npx vitest run convex/projects/mutations.test.ts -t "delete" -x` | Wave 0 |
| PROJ-04 | List projects filtered by status with counts | unit | `npx vitest run convex/projects/queries.test.ts -t "list" -x` | Wave 0 |
| PROJ-05 | Assign task to project | unit | `npx vitest run convex/projects/mutations.test.ts -t "assign" -x` | Wave 0 |
| PROJ-06 | View tasks in project with filters | unit | `npx vitest run convex/projects/queries.test.ts -t "getWithTasks" -x` | Wave 0 |
| PROJ-07 | Task count by status in project view | unit | `npx vitest run convex/projects/queries.test.ts -t "statusSummary" -x` | Wave 0 |
| VIEW-03 | Projects list page renders | unit | `npx vitest run src/features/projects/projects.test.tsx -t "Projects" -x` | Wave 0 |
| VIEW-04 | Project detail page renders with tasks | unit | `npx vitest run src/features/projects/projects.test.tsx -t "Detail" -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test` (full suite with coverage)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/shared/schemas/projects.ts` -- Zod schemas for project domain
- [ ] `convex/projects/queries.ts` -- backend queries (list, getWithTasks)
- [ ] `convex/projects/mutations.ts` -- backend mutations (create, update, delete)
- [ ] `convex/projects/queries.test.ts` -- covers PROJ-04, PROJ-06, PROJ-07
- [ ] `convex/projects/mutations.test.ts` -- covers PROJ-01, PROJ-02, PROJ-03, PROJ-05
- [ ] `src/features/projects/projects.test.tsx` -- covers VIEW-03, VIEW-04
- [ ] `public/locales/en/projects.json` + `public/locales/es/projects.json` -- i18n translations
- [ ] Verify `by_project` index exists on tasks table (added in Phase 3); add if missing

## Open Questions

1. **Should project detail route use a layout or be a standalone page?**
   - What we know: Settings uses a layout (`_layout.settings.tsx`) with a nested index. Projects could follow the same pattern.
   - What's unclear: Whether the projects list and detail need to share a layout (e.g., sidebar with project list + detail pane).
   - Recommendation: Start simple -- Projects list and Project detail as separate full-page routes. A shared layout is a nice-to-have but not required by any requirement.

2. **Task creation within project context**
   - What we know: PROJ-05 says users can assign tasks to projects. PROJ-06 shows tasks within a project.
   - What's unclear: Should users be able to create tasks directly from the project detail view (pre-filling projectId)?
   - Recommendation: Yes -- the project detail view should have a "create task" action that pre-fills the projectId. This is a UX convenience that follows naturally from VIEW-04. Reuse the task form from Phase 3 with projectId pre-set.

3. **Sidebar navigation for projects**
   - What we know: VIEW-06 mentions "Projects section with project list" in sidebar. Phase 3 adds initial nav items.
   - What's unclear: Should the sidebar list individual projects, or just link to the Projects list page?
   - Recommendation: Add a single "Projects" nav item linking to `/dashboard/projects`. Listing individual projects in the nav requires a dynamic query in the nav component, which adds complexity. The projects list page already provides filtering. A dynamic sidebar with project list can be a Phase 6 enhancement if needed.

## Sources

### Primary (HIGH confidence)
- Project codebase: `convex/schema.ts`, `convex/users/mutations.ts` -- established patterns for schema definition and cascade delete via asyncMap
- Project codebase: `src/shared/nav.ts`, `src/shared/errors.ts`, `src/i18n.ts` -- wiring extension points
- Project codebase: `src/routes/_app/_auth/dashboard/` -- route naming conventions
- Phase 3 Research: `.planning/phases/03-tasks/03-RESEARCH.md` -- task schema with projectId field and indexes
- Project codebase: `convex/test.setup.ts`, `convex/users/mutations.test.ts` -- test patterns

### Secondary (MEDIUM confidence)
- [Convex cascade delete patterns](https://discord-questions.convex.dev/m/1270300293984288779) -- asyncMap approach for cascade
- [Convex aggregate counts](https://stack.convex.dev/efficient-count-sum-max-with-the-aggregate-component) -- confirmed simple collect+count is fine for small scale

### Tertiary (LOW confidence)
- None -- all findings verified against project codebase or official Convex sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; all libraries already in project
- Architecture: HIGH -- follows established entity pattern exactly; precedent in Phase 3
- Pitfalls: HIGH -- based on direct codebase analysis and Convex documentation
- Cascade delete: HIGH -- asyncMap pattern already used in the project for auth account cleanup

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain, no fast-moving dependencies)
