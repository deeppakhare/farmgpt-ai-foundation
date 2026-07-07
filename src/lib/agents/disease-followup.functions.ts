import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface FollowupTurn {
  role: "user" | "assistant";
  content: string;
}

export interface DiseaseFollowupInput {
  question: string;
  imageUrl?: string;
  diagnosisContext?: string;
  history?: FollowupTurn[];
}

const SYSTEM_PROMPT = `You are FarmGPT's AI Vision plant-doctor assistant helping an Indian smallholder farmer
understand and act on a previous crop-disease diagnosis. You have access to the uploaded crop
image and the earlier diagnosis. Answer the farmer's follow-up questions clearly and practically.

Rules:
- Keep answers short, warm, and easy to read. Use bullet points where helpful.
- Refer specifically to what's visible in the image and to the diagnosis when relevant.
- Prefer locally available Indian products, safe dosages (g/L or ml/L), and low-cost organic options first.
- If the farmer asks something you cannot tell from the image, say so and ask for a better photo or more info.
- Never invent facts. Do not repeat the full diagnosis unless asked — build on it.
- Reply in the same language the farmer uses.`;

export const askDiseaseFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DiseaseFollowupInput) => data)
  .handler(async ({ data }): Promise<{ content: string }> => {
    const imageBase64 = data.imageUrl?.startsWith("data:")
      ? data.imageUrl.split(",")[1]
      : undefined;
    const imageMimeType = data.imageUrl?.startsWith("data:")
      ? data.imageUrl.slice(5, data.imageUrl.indexOf(";"))
      : "image/jpeg";

    const historyBlock = (data.history ?? [])
      .slice(-8)
      .map((t) => `${t.role === "user" ? "Farmer" : "FarmGPT"}: ${t.content}`)
      .join("\n");

    const parts: string[] = [];
    if (data.diagnosisContext) {
      parts.push(`Earlier diagnosis of the attached crop image:\n${data.diagnosisContext}`);
    }
    if (historyBlock) parts.push(`Conversation so far:\n${historyBlock}`);
    parts.push(`Farmer's new question: ${data.question}`);

    const { callGemini } = await import("@/lib/ai/gemini.server");
    const { text } = await callGemini({
      system: SYSTEM_PROMPT,
      prompt: parts.join("\n\n"),
      imageBase64,
      imageMimeType,
      temperature: 0.4,
      maxOutputTokens: 900,
    });

    return { content: text.trim() || "Sorry, I couldn't generate a response. Please try again." };
  });
