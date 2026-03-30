import { createFileRoute } from "@tanstack/react-router";
import { TeamPoolPage } from "@/features/tasks";
import siteConfig from "~/site.config";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/_layout/team-pool",
)({
  component: TeamPoolPage,
  head: () => ({
    meta: [{ title: `${siteConfig.siteTitle} - Team Pool` }],
  }),
  beforeLoad: () => ({
    headerTitle: "Team Pool",
    headerDescription: "Unassigned tasks available for the team.",
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search.status as string) || undefined,
    priority: (search.priority as string) || undefined,
    assignee: (search.assignee as string) || undefined,
    project: (search.project as string) || undefined,
  }),
});
