import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navigation } from "./-ui.navigation";
import { Header } from "@/ui/header";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: user } = useQuery(
    convexQuery(api.users.queries.getCurrentUser, {}),
  );
  if (!user) {
    return null;
  }
  return (
    <div className="flex min-h-[100vh] w-full flex-col bg-secondary dark:bg-black">
      <Navigation user={user} />
      <Header />
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-screen-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
