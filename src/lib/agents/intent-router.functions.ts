import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AgentInput, AgentName } from "./types";

const AGENTS: Exclude<AgentName, "intent-router">[] = [
  "general-agent",
  "disease-agent",
  "weather-agent",
  "market-agent",
  "government-agent",
  "fertilizer-agent",
];

const SYSTEM = `You are the intent router for FarmGPT, an AI assistant for Indian farmers.
Classify the user's message into EXACTLY ONE of these agents:

- general-agent: greetings (hi, hello, hey, namaste, thanks), small talk, "who are you",
  "what can you do", meta questions, or AMBIGUOUS requests where you can't tell which
  domain fits. When in doubt, choose general-agent — never disease-agent.
- disease-agent: crop diseases, pests, insects, leaf/plant symptoms, image diagnosis,
  fungicides/pesticides, treatment. Requires clear disease/pest context.
- weather-agent: weather, rain, temperature, humidity, wind, forecast, spraying windows.
- market-agent: mandi prices, crop rates, market trends, selling advice.
- government-agent: government schemes, subsidies, PM-KISAN, PM-KUSUM, PMFBY, KCC,
  insurance, loans, eligibility.
- fertilizer-agent: fertilizer, NPK, urea, DAP, MOP, micronutrients, irrigation schedule,
  drip/sprinkler, water timing, nutrient deficiency.

Rules:
- Greetings and thanks → general-agent.
- Never route greetings or ambiguous messages to disease-agent.
- Pick the closest domain match only when the message clearly belongs there.

Reply with ONLY the agent name (e.g. "weather-agent"). No other text.`;

const GREETING_RE = /^\s*(hi|hii+|hey+|hello+|helo+|yo|namaste|namaskara|namaskar|vanakkam|salaam|salam|thanks?|thank\s+you|thx|ty|good\s+(morning|afternoon|evening|night)|who\s+are\s+you|what\s+can\s+you\s+do|help)\b[\s!.?]*$/i;

export const routeIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AgentInput) => data)
  .handler(async ({ data }): Promise<{ agent: Exclude<AgentName, "intent-router"> }> => {
    const msg = data.message.trim();

    // Fast-path: obvious greetings & meta questions.
    if (GREETING_RE.test(msg) || msg.length < 3) {
      return { agent: "general-agent" };
    }

    try {
      const { callGemini } = await import("@/lib/ai/gemini.server");
      const { text } = await callGemini({
        system: SYSTEM,
        prompt: msg,
        temperature: 0,
        maxOutputTokens: 20,
      });
      const normalized = text.trim().toLowerCase();
      const match = AGENTS.find((a) => normalized.includes(a));
      return { agent: match ?? "general-agent" };
    } catch (err) {
      console.error("[intent-router] fallback:", err);
      return { agent: "general-agent" };
    }
  });
