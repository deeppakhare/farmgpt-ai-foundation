import { Link, useRouterState } from "@tanstack/react-router";
import {
  Search,
  MessageSquare,
  ScanLine,
  CloudSun,
  CalendarRange,
  LineChart,
  FileBarChart2,
  Tractor,
  Settings,
  LogOut,
  Plus,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,

} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFarmer } from "@/hooks/useFarmer";

const RECENT_CHATS = [
  "Yellow spots on tomato leaves",
  "Best fertilizer for wheat this season",
  "Irrigation schedule for next week",
  "Government subsidy for drip irrigation",
  "Market price forecast — cotton",
];

const TOOLS_GROUP = {
  label: "Tools",
  items: [
    { to: "/disease-scanner", label: "Disease Scanner", icon: ScanLine },
    { to: "/weather", label: "Weather", icon: CloudSun },
    { to: "/farm-planner", label: "Farm Planner", icon: CalendarRange },
    { to: "/market-intelligence", label: "Market Intelligence", icon: LineChart },
    { to: "/reports", label: "Reports", icon: FileBarChart2 },
    { to: "/command-center", label: "Command Center", icon: LayoutDashboard },
  ],
} as const;

const FARM_GROUP = {
  label: "Farm",
  items: [
    { to: "/farm-profile", label: "Profile", icon: Tractor },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
} as const;

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { name, initials } = useFarmer();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        collapsed ? "w-[76px]" : "w-[280px]",
      )}
    >
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        {collapsed ? <Logo showText={false} /> : <Logo />}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground md:inline-flex"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {/* Main */}
        {!collapsed && (
          <div className="px-3 pt-1 pb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Main
          </div>
        )}
        <div className="px-3">
          <Link to="/chat" onClick={onNavigate}>
            <Button className="w-full justify-start gap-2 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
              <Plus className="h-4 w-4" />
              {!collapsed && <span>New chat</span>}
            </Button>
          </Link>
        </div>

        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search chats" className="h-9 border-white/5 bg-white/5 pl-8 text-sm" />
            </div>
          </div>
        )}

        {!collapsed && (
          <>
            <div className="px-3 pt-4 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Recent Chats
            </div>
            <div className="space-y-0.5 px-2">
              {RECENT_CHATS.map((c, i) => (
                <Link
                  key={i}
                  to="/chat"
                  onClick={onNavigate}
                  className="flex w-full items-center gap-2 truncate rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Grouped nav */}
        {GROUPS.map((group) => (
          <div key={group.label} className="mt-4">
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </div>
            )}
            <nav className="space-y-0.5 px-2">
              {group.items.map((n) => {
                const active = pathname.startsWith(n.to);
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
                    {!collapsed && <span>{n.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-3 rounded-lg p-2", !collapsed && "hover:bg-sidebar-accent")}>
          <Avatar className="h-9 w-9 ring-2 ring-primary/30">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium capitalize">{name}</div>
              <div className="truncate text-xs text-muted-foreground">Farmer • Karnataka</div>
            </div>
          )}
          {!collapsed && (
            <Link to="/login" aria-label="Sign out" className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
