import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "~/convex/_generated/api";
import type { Id } from "~/convex/_generated/dataModel";

interface SearchResultsDropdownProps {
  searchTerm: string;
  onClose: () => void;
}

/** Dropdown showing search results grouped by entity type (tasks, projects). */
export function SearchResultsDropdown({
  searchTerm,
  onClose,
}: SearchResultsDropdownProps) {
  const navigate = useNavigate();

  const { data: tasks = [] } = useQuery(
    convexQuery(api.tasks.queries.search, { searchTerm, limit: 5 }),
  );
  const { data: projects = [] } = useQuery(
    convexQuery(api.projects.queries.search, { searchTerm, limit: 5 }),
  );

  const hasResults = tasks.length > 0 || projects.length > 0;

  const handleTaskClick = (_taskId: Id<"tasks">) => {
    void navigate({ to: "/dashboard/tasks" });
    onClose();
  };

  const handleProjectClick = (projectId: Id<"projects">) => {
    void navigate({
      to: "/dashboard/projects/$projectId",
      params: { projectId },
    });
    onClose();
  };

  return (
    <div className="absolute top-full left-0 z-50 mt-1 w-[320px] rounded-md border border-border bg-card shadow-lg">
      {!hasResults ? (
        <p className="px-3 py-4 text-center text-sm text-primary/50">
          No results found
        </p>
      ) : (
        <div className="max-h-[320px] overflow-y-auto">
          {tasks.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium text-primary/50">
                Tasks
              </p>
              {tasks.map(
                (task: { _id: Id<"tasks">; title: string; status: string }) => (
                  <button
                    key={task._id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-secondary"
                    onClick={() => handleTaskClick(task._id)}
                  >
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto text-xs text-primary/40">
                      {task.status}
                    </span>
                  </button>
                ),
              )}
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium text-primary/50">
                Projects
              </p>
              {projects.map(
                (project: {
                  _id: Id<"projects">;
                  name: string;
                  status: string;
                }) => (
                  <button
                    key={project._id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-secondary"
                    onClick={() => handleProjectClick(project._id)}
                  >
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto text-xs text-primary/40">
                      {project.status}
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
