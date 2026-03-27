import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailPage } from "@/features/projects";
import siteConfig from "~/site.config";
import type { Id } from "~/convex/_generated/dataModel";

function ProjectDetailRoute() {
  const { projectId } = Route.useParams();
  return <ProjectDetailPage projectId={projectId as Id<"projects">} />;
}

export const Route = createFileRoute(
  "/_app/_auth/dashboard/_layout/projects/$projectId",
)({
  component: ProjectDetailRoute,
  head: () => ({
    meta: [{ title: `${siteConfig.siteTitle} - Project` }],
  }),
  beforeLoad: () => ({
    headerTitle: "Project",
    headerDescription: "View and manage project tasks.",
  }),
});
