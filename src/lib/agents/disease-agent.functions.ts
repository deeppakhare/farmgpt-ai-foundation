import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AgentInput, AgentResponse } from "./types";

export const runDiseaseAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AgentInput) => data)
  .handler(async (): Promise<AgentResponse> => {
    return { agent: "disease-agent", content: "Disease agent not yet implemented." };
  });
