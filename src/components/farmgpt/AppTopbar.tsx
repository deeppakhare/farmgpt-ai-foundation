import { Bell, Sun, Moon, User, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { NOTIFICATIONS, toneClass } from "@/lib/farm-mocks";
import { useFarmer } from "@/hooks/useFarmer";
import { cn } from "@/lib/utils";

export function AppTopbar({ title, onMenu }: { title: string; onMenu?: () => void }) {
  const [dark, setDark] = useState(true);
  const navigate = useNavigate();
  const { name, initials } = useFarmer();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add("dark"); root.classList.remove("light"); }
    else { root.classList.add("light"); root.classList.remove("dark"); }
  }, [dark]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      {onMenu && (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open menu">
          ☰
        </Button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-base font-semibold tracking-tight md:text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-[18px] w-[18px]" />
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center rounded-full bg-accent p-0 text-[10px] text-accent-foreground">
                {NOTIFICATIONS.length}
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div>
                <div className="font-display text-sm font-semibold">Farm alerts</div>
                <div className="text-[11px] text-muted-foreground">Personalized for your farm</div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground">
                Mark all read
              </Button>
            </div>
            <ScrollArea className="max-h-[380px]">
              <ul>
                {NOTIFICATIONS.map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <li
                      key={i}
                      className="flex items-start gap-3 border-b border-border/40 px-4 py-3 last:border-b-0 hover:bg-white/[0.03]"
                    >
                      <div className={cn("shrink-0 rounded-lg p-2", toneClass[n.tone])}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium">{n.title}</div>
                          <div className="text-[10px] whitespace-nowrap text-muted-foreground">{n.time}</div>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark((d) => !d)}>
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="capitalize">{name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/farm-profile"><User className="mr-2 h-4 w-4" />Farm profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
