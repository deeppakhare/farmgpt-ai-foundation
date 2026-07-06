import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AgentInput, AgentName } from "./types";

/**
 * Classifies a user message to the right specialised agent.
 * Stub — always returns "disease-agent" until AI is wired.
 */
export const routeIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AgentInput) => data)
  .handler(async (): Promise<{ agent: AgentName }> => {
    return { agent: "disease-agent" };
  });
