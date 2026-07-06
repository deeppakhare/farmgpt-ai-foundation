import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AgentInput, AgentName } from "./types";

const AGENTS: AgentName[] = [
  "disease-agent",
  "weather-agent",
  "market-agent",
  "government-agent",
];

const SYSTEM = `You are the intent router for FarmGPT, an AI assistant for Indian farmers.
Classify the user's message into EXACTLY ONE of these agents:
- disease-agent: crop diseases, pests, leaf/plant symptoms, image diagnosis, fungicides/pesticides, treatment.
- weather-agent: weather, rain, temperature, irrigation timing, spraying windows, seasonal outlook.
- market-agent: mandi prices, market trends, selling advice, commodity prices.
- government-agent: government schemes, subsidies, PM-KISAN, KUSUM, insurance, loans, eligibility.

If ambiguous, choose the closest match. If none fit, choose disease-agent.
Reply with ONLY the agent name (e.g. "weather-agent"). No other text.`;

export const routeIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AgentInput) => data)
  .handler(async ({ data }): Promise<{ agent: AgentName }> => {
    try {
      const { callGemini } = await import("@/lib/ai/gemini.server");
      const { text } = await callGemini({
        system: SYSTEM,
        prompt: data.message,
        temperature: 0,
        maxOutputTokens: 20,
      });
      const normalized = text.trim().toLowerCase();
      const match = AGENTS.find((a) => normalized.includes(a));
      return { agent: match ?? "disease-agent" };
    } catch (err) {
      console.error("[intent-router] fallback:", err);
      return { agent: "disease-agent" };
    }
  });
