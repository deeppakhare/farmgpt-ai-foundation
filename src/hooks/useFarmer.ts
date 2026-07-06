import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function nameFromUser(u: { user_metadata?: Record<string, unknown>; email?: string | null } | null) {
  if (!u) return "Farmer";
  const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
  const full = meta.full_name || meta.name || meta.display_name;
  if (full) return String(full).split(" ")[0];
  if (u.email) return u.email.split("@")[0].replace(/[._-].*/, "");
  return "Farmer";
}

export function useFarmer() {
  const [name, setName] = useState("Farmer");
  const [initials, setInitials] = useState("FA");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const n = nameFromUser(data.user as never);
      setName(n);
      setInitials(n.slice(0, 2).toUpperCase());
    });
  }, []);

  return { name, initials, greeting: greeting() };
}
