import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Logo } from "@/ui/logo";
import { useConvexAuth } from "convex/react";

const HOME_PATH = "/";

export const Route = createFileRoute("/_app/login/_layout")({
  component: LoginLayout,
});

function LoginLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading && !isAuthenticated) {
    return null;
  }
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-card">
      <div className="absolute left-6 top-6">
        <Link to={HOME_PATH} className="flex h-10 w-10 items-center gap-1">
          <Logo />
        </Link>
      </div>
      <div className="w-full max-w-md px-6">
        <Outlet />
      </div>
    </div>
  );
}
