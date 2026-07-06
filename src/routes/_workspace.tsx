import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/farmgpt/AppSidebar";
import { AppTopbar } from "@/components/farmgpt/AppTopbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useRouterState } from "@tanstack/react-router";

const TITLES: Record<string, string> = {
  "/workspace/dashboard": "FarmGPT",
  "/workspace/disease-scanner": "Disease Scanner",
  "/workspace/weather": "Weather",
  "/workspace/reports": "Reports",
  "/workspace/farm-profile": "Farm Profile",
  "/workspace/settings": "Settings",
};

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = TITLES[pathname] ?? "FarmGPT AI";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden md:block h-full">
        <AppSidebar />
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[300px] border-r-0 bg-sidebar p-0">
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar title={title} onMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
