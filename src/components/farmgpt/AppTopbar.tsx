import { Bell, Sun, Moon, User, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export function AppTopbar({ title, onMenu }: { title: string; onMenu?: () => void }) {
  const [dark, setDark] = useState(true);
  const navigate = useNavigate();
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
          <span className="i-lucide-menu h-5 w-5" />
          ☰
        </Button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-base font-semibold tracking-tight md:text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4.5 w-4.5" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center rounded-full bg-accent p-0 text-[10px] text-accent-foreground">3</Badge>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark((d) => !d)}>
          {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">RK</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Ravi Kumar</DropdownMenuLabel>
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
