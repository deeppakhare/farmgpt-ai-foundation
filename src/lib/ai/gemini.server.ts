// Server-only Gemini helper via Lovable AI Gateway.
// Uses LOVABLE_API_KEY (auto-provisioned) — no Google Cloud setup required.

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

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function getApiKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not set");
  return key;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

/**
 * Call Gemini via the Lovable AI Gateway and return the generated text.
 */
export async function callGemini(opts: GeminiCallOptions): Promise<GeminiResult> {
  const model = opts.model ?? "google/gemini-3-flash-preview";

  const userContent: ContentPart[] = [{ type: "text", text: opts.prompt }];
  if (opts.imageBase64) {
    const mime = opts.imageMimeType ?? "image/jpeg";
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mime};base64,${opts.imageBase64}` },
    });
  }

  const messages: Array<{ role: string; content: string | ContentPart[] }> = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: userContent });

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.maxOutputTokens !== undefined ? { max_tokens: opts.maxOutputTokens } : {}),
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Lovable AI Gateway request failed [${response.status}]: ${errBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text, raw: data };
}
