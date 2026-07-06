# FarmGPT AI Agents

Server-function stubs for the FarmGPT agent architecture. All agents run on
the TanStack Start server runtime (NOT Supabase Edge Functions), guarded by
`requireSupabaseAuth` so they execute as the signed-in user with RLS applied.

## Agents

| Agent              | File                              | Purpose                                     |
| ------------------ | --------------------------------- | ------------------------------------------- |
| `intent-router`    | `intent-router.functions.ts`      | Classifies user message → target agent      |
| `disease-agent`    | `disease-agent.functions.ts`      | Crop image diagnosis                        |
| `weather-agent`    | `weather-agent.functions.ts`      | Weather-based recommendations               |
| `market-agent`     | `market-agent.functions.ts`       | Mandi prices & market advice                |
| `government-agent` | `government-agent.functions.ts`   | Government schemes & subsidies              |

Shared Gemini helper: `src/lib/ai/gemini.server.ts` (server-only, stub).

## Flow (future)

1. Client calls `routeIntent({ data: { message } })`.
2. Router returns `{ agent }`.
3. Client calls the matching agent server function.
4. Agent calls `callGemini(...)` in `gemini.server.ts` and persists results
   into `chat_history` / `chat_messages` / `reports` via RLS-scoped queries.
