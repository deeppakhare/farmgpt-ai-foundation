import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AgentInput, AgentResponse, JsonValue } from "./types";

type Severity = "Mild" | "Moderate" | "Severe" | "Unknown";
type Emergency = "Low" | "Medium" | "High" | "Critical";

interface VisionDiagnosis {
  diseaseName: string;
  confidence: number;
  severity: Severity;
  symptoms: string[];
  possibleCause: string;
  organicTreatment: string[];
  chemicalTreatment: string[];
  preventionTips: string[];
  nextActions: string[];
  emergencyLevel: Emergency;
}

const SYSTEM_PROMPT = `You are FarmGPT's AI Vision plant pathologist for Indian farmers.
You analyze the attached crop image (and the farmer's message) to diagnose diseases,
pests, or nutrient disorders.

Return ONLY a valid JSON object (no prose, no markdown fences) matching this exact schema:
{
  "diseaseName": string,                       // concise disease/pest name; "Unclear" if you cannot tell
  "confidence": number,                        // 0-100 integer
  "severity": "Mild" | "Moderate" | "Severe" | "Unknown",
  "symptoms": string[],                        // 2-5 short bullets of what you SEE in the image
  "possibleCause": string,                     // 1-2 sentences on pathogen/pest/condition
  "organicTreatment": string[],                // 2-4 practical bullets, locally available in India
  "chemicalTreatment": string[],               // 2-4 bullets with product + dosage (g/L or ml/L) + safety
  "preventionTips": string[],                  // 2-4 bullets
  "nextActions": string[],                     // 3-5 ordered, immediate steps the farmer should take today
  "emergencyLevel": "Low" | "Medium" | "High" | "Critical"
}

Rules:
- If the image is unclear, wrong subject, or you are uncertain, set confidence < 70 and
  set "nextActions" to instructions for the farmer to capture better photos
  (close-up of affected leaf top & bottom, whole plant, any affected fruit/stem, in daylight).
  In that case leave organicTreatment and chemicalTreatment as empty arrays.
- Be concise. Use simple language suitable for smallholder farmers.
- Use Indian brand/product names where possible (Mancozeb, Copper Oxychloride, Neem oil, etc.).
- Never invent facts. If unsure, lower confidence — don't guess a specific disease.`;

function parseJson(text: string): VisionDiagnosis | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as VisionDiagnosis;
  } catch {
    return null;
  }
}

function normalize(raw: Partial<VisionDiagnosis> | null): VisionDiagnosis {
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
  const sev = (["Mild", "Moderate", "Severe", "Unknown"] as Severity[]).includes(
    raw?.severity as Severity,
  )
    ? (raw?.severity as Severity)
    : "Unknown";
  const em = (["Low", "Medium", "High", "Critical"] as Emergency[]).includes(
    raw?.emergencyLevel as Emergency,
  )
    ? (raw?.emergencyLevel as Emergency)
    : "Low";
  const confRaw = Number(raw?.confidence ?? 0);
  const confidence = Math.max(0, Math.min(100, Math.round(isFinite(confRaw) ? confRaw : 0)));
  return {
    diseaseName: String(raw?.diseaseName ?? "Unclear diagnosis"),
    confidence,
    severity: sev,
    symptoms: arr(raw?.symptoms),
    possibleCause: String(raw?.possibleCause ?? ""),
    organicTreatment: arr(raw?.organicTreatment),
    chemicalTreatment: arr(raw?.chemicalTreatment),
    preventionTips: arr(raw?.preventionTips),
    nextActions: arr(raw?.nextActions),
    emergencyLevel: em,
  };
}

export const runDiseaseAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AgentInput) => data)
  .handler(async ({ data }): Promise<AgentResponse> => {
    // No image → ask for one, don't diagnose.
    if (!data.imageUrl) {
      return {
        agent: "disease-agent",
        content:
          "📸 **Please upload a clear photo of the affected crop first.**\n\n" +
          "For an accurate diagnosis, I need to see the plant. Please share:\n\n" +
          "- A close-up of the affected leaf (top and underside)\n" +
          "- A photo of the whole plant\n" +
          "- Any affected fruit, stem, or roots\n\n" +
          "Take the photos in daylight and try to keep them in focus. Once you attach the image, I'll diagnose the disease and recommend a treatment plan.",
      };
    }

    const imageBase64 = data.imageUrl.startsWith("data:")
      ? data.imageUrl.split(",")[1]
      : undefined;
    const imageMimeType = data.imageUrl.startsWith("data:")
      ? data.imageUrl.slice(5, data.imageUrl.indexOf(";"))
      : "image/jpeg";

    const contextLines: string[] = [];
    if (data.location) {
      contextLines.push(`Farmer location: ${data.location.lat}, ${data.location.lng}`);
    }
    if (data.language) contextLines.push(`Preferred language: ${data.language}`);
    const contextBlock = contextLines.length ? `\n\nContext:\n${contextLines.join("\n")}` : "";

    const { callGemini } = await import("@/lib/ai/gemini.server");
    const { text } = await callGemini({
      system: SYSTEM_PROMPT,
      prompt: `Farmer's message: ${data.message || "(no text provided — please analyze the image)"}${contextBlock}\n\nReturn the JSON now.`,
      imageBase64,
      imageMimeType,
      temperature: 0.2,
      maxOutputTokens: 1400,
      jsonMode: true,
    });

    const parsed = normalize(parseJson(text));
    const lowConfidence = parsed.confidence < 70;

    const visionBlock: JsonValue = {
      kind: "diseaseVision",
      diseaseName: parsed.diseaseName,
      confidence: parsed.confidence,
      severity: parsed.severity,
      symptoms: parsed.symptoms,
      possibleCause: parsed.possibleCause,
      organicTreatment: parsed.organicTreatment,
      chemicalTreatment: parsed.chemicalTreatment,
      preventionTips: parsed.preventionTips,
      nextActions: parsed.nextActions.length
        ? parsed.nextActions
        : lowConfidence
          ? [
              "Take a close-up photo of the affected leaf (top side).",
              "Take a photo of the underside of the same leaf.",
              "Take a wider photo of the whole plant.",
              "Photograph any affected fruit, stem, or roots — in daylight.",
            ]
          : [],
      emergencyLevel: parsed.emergencyLevel,
      ...(lowConfidence
        ? {
            lowConfidenceNotice:
              "I'm not confident enough in this diagnosis. Please share 2–3 more clear photos before I recommend a treatment.",
          }
        : {}),
    };

    const intro = lowConfidence
      ? "I couldn't diagnose this confidently. I need a few more photos before recommending treatment."
      : `Here's the AI Vision diagnosis for the image you shared.`;

    return {
      agent: "disease-agent",
      content: intro,
      blocks: [visionBlock],
    };
  });
