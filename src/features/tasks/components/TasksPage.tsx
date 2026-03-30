import { useState } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { api } from "~/convex/_generated/api";
import { TaskForm } from "./TaskForm";
import { TaskList } from "./TaskList";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { TaskFilterBar } from "./TaskFilterBar";
import type { Id } from "~/convex/_generated/dataModel";

interface FilterSearch {
  status?: string;
  priority?: string;
  assignee?: string;
  project?: string;
}

export function TasksPage() {
  const search = useSearch({ strict: false }) as FilterSearch;

  // Build query args from URL params
  const filterArgs: {
    status?: string;
    priority?: boolean;
    assigneeId?: string;
    projectId?: Id<"projects">;
  } = {};
  if (search.status) filterArgs.status = search.status;
  if (search.priority) filterArgs.priority = search.priority === "high";
  if (search.assignee) filterArgs.assigneeId = search.assignee;
  if (search.project) filterArgs.projectId = search.project as Id<"projects">;

  // Default to "me" filter when no assignee filter is set (My Tasks view)
  if (!search.assignee) filterArgs.assigneeId = "me";

  const { data: tasks = [] } = useQuery(
    convexQuery(api.tasks.queries.listFiltered, filterArgs),
  );

  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(
    null,
  );

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <TaskFilterBar />

      <TaskForm />

      <TaskList
        tasks={tasks}
        emptyMessage="No tasks yet. Create one above!"
        onTaskClick={(taskId) => setSelectedTaskId(taskId)}
      />

      <TaskDetailPanel
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
