import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AgentInput, AgentResponse } from "./types";

export const runWeatherAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AgentInput) => data)
  .handler(async (): Promise<AgentResponse> => {
    return { agent: "weather-agent", content: "Weather agent not yet implemented." };
  });
