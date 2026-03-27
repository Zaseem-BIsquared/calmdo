import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/projects";
import siteConfig from "~/site.config";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/_layout/projects/",
)({
  component: ProjectsPage,
  head: () => ({
    meta: [{ title: `${siteConfig.siteTitle} - Projects` }],
  }),
  beforeLoad: () => ({
    headerTitle: "Projects",
    headerDescription: "Manage your projects and their tasks.",
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search.status as string) || undefined,
  }),
});
