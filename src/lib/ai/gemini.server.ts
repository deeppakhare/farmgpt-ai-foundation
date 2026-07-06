// Server-only Gemini helper (stub — no network calls yet).
// Used by agent server functions under src/lib/agents/*.functions.ts.
// Real implementation will call Gemini via fetch inside the handler body.

export interface GeminiCallOptions {
  model?: string;
  system?: string;
  prompt: string;
  imageBase64?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResult {
  text: string;
  raw?: unknown;
}

/**
 * Placeholder Gemini caller. Do NOT invoke from client code.
 * Wire real implementation later; keep signature stable so agents don't change.
 */
export async function callGemini(_opts: GeminiCallOptions): Promise<GeminiResult> {
  throw new Error("Gemini integration is not yet configured.");
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}
