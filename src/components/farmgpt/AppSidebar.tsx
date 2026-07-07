import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  Trash2,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFarmer } from "@/hooks/useFarmer";
import { listChats, searchChats, deleteChat, type ChatSummary } from "@/lib/chat/chat.functions";
import { toast } from "sonner";


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
  const search = useRouterState({ select: (s) => s.location.search as { c?: string } });
  const activeChatId = search?.c;
  const navigate = useNavigate();
  const { name, initials } = useFarmer();

  const listChatsFn = useServerFn(listChats);
  const searchChatsFn = useServerFn(searchChats);
  const deleteChatFn = useServerFn(deleteChat);

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useMemo(
    () => () => {
      setChatsLoading(true);
      listChatsFn()
        .then(setChats)
        .catch(() => {})
        .finally(() => setChatsLoading(false));
    },
    [listChatsFn],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh whenever route or active chat changes so newly-created chats show up.
  useEffect(() => {
    refresh();
  }, [pathname, activeChatId, refresh]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchChatsFn({ data: { q } })
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchChatsFn]);

  const displayed = results ?? chats;

  const handleDelete = async (id: string) => {
    try {
      await deleteChatFn({ data: { chatId: id } });
      setChats((prev) => prev.filter((c) => c.id !== id));
      setResults((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
      if (activeChatId === id) void navigate({ to: "/chat", search: {} });
      toast.success("Conversation deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };



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
        {/* Tools */}
        <div className="mt-1">
          {!collapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {TOOLS_GROUP.label}
            </div>
          )}
          <nav className="space-y-0.5 px-2">
            {TOOLS_GROUP.items.map((n) => {
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

        {/* Main */}
        {!collapsed && (
          <div className="px-3 pt-4 pb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Main
          </div>
        )}
        <div className={cn("px-3", collapsed && "pt-4")}>
          <Link to="/chat" search={{}} onClick={onNavigate}>
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
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats…"
                className="h-9 border-white/5 bg-white/5 pl-8 text-sm"
              />
              {searching && (
                <Loader2 className="absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        )}

        {!collapsed && (
          <>
            <div className="flex items-center justify-between px-3 pt-4 pb-1.5">
              <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {results ? `Results (${displayed.length})` : "Recent Chats"}
              </div>
              {chatsLoading && !results && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="space-y-0.5 px-2 pb-2">
              {displayed.length === 0 && !chatsLoading && (
                <div className="rounded-lg px-2.5 py-3 text-xs text-muted-foreground">
                  {results
                    ? `No chats match "${query}".`
                    : "No conversations yet. Ask FarmGPT anything to get started."}
                </div>
              )}
              {displayed.map((c) => {
                const isActive = c.id === activeChatId;
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "group flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                    )}
                  >
                    <MessageSquare
                      className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", isActive && "text-accent")}
                    />
                    <button
                      onClick={() => {
                        void navigate({ to: "/chat", search: { c: c.id } });
                        onNavigate?.();
                      }}
                      className="min-w-0 flex-1 text-left"
                      title={c.title}
                    >
                      <div className="truncate">{c.title || "Untitled chat"}</div>
                      {c.preview && (
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                          {c.preview}
                        </div>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(c.id);
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 hover:bg-white/10 hover:text-rose-300 group-hover:opacity-100"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </ScrollArea>


      {/* Farm — pinned above user footer */}
      <div className="border-t border-sidebar-border pt-2 pb-1">
        {!collapsed && (
          <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {FARM_GROUP.label}
          </div>
        )}
        <nav className="space-y-0.5 px-2">
          {FARM_GROUP.items.map((n) => {
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
