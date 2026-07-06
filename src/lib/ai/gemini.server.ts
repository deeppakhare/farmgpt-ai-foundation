// Server-only Gemini helper. Do NOT import from client code.
// Uses the official @google/genai SDK with GEMINI_API_KEY.

import { GoogleGenAI } from "@google/genai";

export interface GeminiCallOptions {
  model?: string;
  system?: string;
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResult {
  text: string;
  raw?: unknown;
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

let cachedClient: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  }
  return cachedClient;
}

/**
 * Call Gemini and return the generated text.
 */
export async function callGemini(opts: GeminiCallOptions): Promise<GeminiResult> {
  const client = getClient();
  const model = opts.model ?? "gemini-2.5-flash";

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: opts.prompt },
  ];
  if (opts.imageBase64) {
    parts.push({
      inlineData: {
        mimeType: opts.imageMimeType ?? "image/jpeg",
        data: opts.imageBase64,
      },
    });
  }

  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      ...(opts.system ? { systemInstruction: opts.system } : {}),
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.maxOutputTokens !== undefined ? { maxOutputTokens: opts.maxOutputTokens } : {}),
    },
  });

  const text = response.text ?? "";
  return { text, raw: response };
}
