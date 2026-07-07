import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/farmgpt/AppSidebar";
import { AppTopbar } from "@/components/farmgpt/AppTopbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

const TITLES: Record<string, string> = {
  "/dashboard": "FarmGPT",
  "/chat": "Chat",
  "/command-center": "Command Center",
  "/disease-scanner": "Disease Scanner",
  "/weather": "Weather",
  "/farm-planner": "Farm Planner",
  "/market-intelligence": "Market Intelligence",
  "/reports": "Reports",
  "/farm-profile": "Farm Profile",
  "/settings": "Settings",
};


export const Route = createFileRoute("/_workspace")({
  ssr: false,
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = TITLES[pathname] ?? "FarmGPT AI";

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setChecking(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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
