import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AgentInput, AgentResponse } from "./types";

export const runMarketAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AgentInput) => data)
  .handler(async ({ data }): Promise<AgentResponse> => {
    const { runAgent } = await import("./run-agent.server");
    return runAgent("market-agent", data);
  });
