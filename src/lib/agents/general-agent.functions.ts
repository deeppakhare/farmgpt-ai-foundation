import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AgentInput, AgentResponse } from "./types";

export const runGeneralAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AgentInput) => data)
  .handler(async ({ data }): Promise<AgentResponse> => {
    const { runAgent } = await import("./run-agent.server");
    return runAgent("general-agent", data);
  });
