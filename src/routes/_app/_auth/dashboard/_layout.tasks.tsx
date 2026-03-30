import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/features/tasks";
import siteConfig from "~/site.config";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout/tasks")({
  component: TasksPage,
  head: () => ({
    meta: [{ title: `${siteConfig.siteTitle} - My Tasks` }],
  }),
  beforeLoad: () => ({
    headerTitle: "My Tasks",
    headerDescription: "Your assigned tasks across all projects.",
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search.status as string) || undefined,
    priority: (search.priority as string) || undefined,
    assignee: (search.assignee as string) || undefined,
    project: (search.project as string) || undefined,
  }),
});
