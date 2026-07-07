import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CommandInput {
  farmerName: string;
  village: string;
  district: string;
  state: string;
  landSizeAcres: number;
  crop: string;
  soil: string;
  water: string;
  sowingDate?: string;
}

export type AlertType =
  | "disease"
  | "weather"
  | "market"
  | "irrigation"
  | "fertilizer"
  | "harvest"
  | "scheme";
export type AlertSeverity = "critical" | "warning" | "info" | "success";

export interface SmartAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  action: string;
  dueDate?: string;
}

export interface TimelineEvent {
  date: string; // YYYY-MM-DD
  title: string;
  category: string;
  detail: string;
}

export interface Recommendation {
  title: string;
  detail: string;
  impact: "High" | "Medium" | "Low";
  category: string;
}

export interface DailyBrief {
  farmHealth: string;
  weather: string;
  crop: string;
  diseaseRisk: string;
  irrigation: string;
  fertilizer: string;
  market: string;
  scheme: string;
  topPriority: string;
}

export interface HealthScoreBreakdown {
  cropHealth: number;
  irrigation: number;
  diseaseRisk: number;
  planner: number;
  weather: number;
}

export interface CommandCenterReport {
  headline: string;
  generatedAt: string;
  score: number; // 0-100
  scoreLabel: string;
  breakdown: HealthScoreBreakdown;
  brief: DailyBrief;
  alerts: SmartAlert[];
  timeline: TimelineEvent[];
  recommendations: Recommendation[]; // exactly 3
}

const SYSTEM = `You are FarmGPT's Farm Command Center — a proactive AI operating system for Indian farmers.
Given the farmer's profile (crop, region, soil, water source, land size, sowing date), you generate a complete
"daily brief" as if you had already analyzed weather patterns, disease pressure, mandi prices, irrigation status,
and government scheme calendars for that region and crop.

Return ONLY valid JSON (no markdown fences, no prose) matching this exact schema:
{
  "headline": string,
  "score": number,           // 0-100 overall farm health score
  "scoreLabel": string,      // "Excellent" | "Healthy" | "At Risk" | "Critical"
  "breakdown": {
    "cropHealth": number,    // 0-100
    "irrigation": number,
    "diseaseRisk": number,   // 100 = no risk, 0 = severe risk
    "planner": number,
    "weather": number
  },
  "brief": {
    "farmHealth": string, "weather": string, "crop": string,
    "diseaseRisk": string, "irrigation": string, "fertilizer": string,
    "market": string, "scheme": string, "topPriority": string
  },
  "alerts": [
    { "id": string, "type": "disease"|"weather"|"market"|"irrigation"|"fertilizer"|"harvest"|"scheme",
      "severity": "critical"|"warning"|"info"|"success",
      "title": string, "message": string, "action": string, "dueDate": "YYYY-MM-DD" }
  ],
  "timeline": [ { "date": "YYYY-MM-DD", "title": string, "category": string, "detail": string } ],
  "recommendations": [ { "title": string, "detail": string, "impact": "High"|"Medium"|"Low", "category": string } ]
}

Rules:
- Generate 5-7 smart alerts covering at least: disease risk, weather warning, market opportunity, irrigation due,
  fertilizer due, harvest window (if applicable), and one relevant government scheme deadline.
- Generate 6-10 timeline events over the next 30 days, sorted chronologically, real dates from today.
- Generate EXACTLY 3 recommendations, each highly personalized to the crop, region, and season.
- Each brief field is 1-2 short sentences in simple farmer-friendly English.
- Score reflects realistic conditions; scoreLabel matches ranges: 85+ Excellent, 70-84 Healthy, 50-69 At Risk, <50 Critical.
- Use realistic Indian mandi prices, crop stages, disease names, and scheme names (PM-KISAN, PMFBY, PM-KUSUM, KCC, etc.).`;

function parseJson<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s < 0 || e < 0) return null;
  try {
    return JSON.parse(cleaned.slice(s, e + 1)) as T;
  } catch {
    return null;
  }
}

export const generateCommandBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CommandInput) => data)
  .handler(async ({ data }): Promise<CommandCenterReport> => {
    const { callGemini } = await import("@/lib/ai/gemini.server");
    const today = new Date().toISOString().slice(0, 10);

    const prompt = `Today's date: ${today}
Farmer profile:
- Name: ${data.farmerName}
- Location: ${data.village}, ${data.district}, ${data.state}
- Land size: ${data.landSizeAcres} acres
- Crop: ${data.crop}
- Soil: ${data.soil}
- Water source: ${data.water}
- Sowing date: ${data.sowingDate ?? "not specified — assume mid-season"}

Generate the full Farm Command Center JSON now.`;

    const { text } = await callGemini({
      system: SYSTEM,
      prompt,
      temperature: 0.5,
      maxOutputTokens: 4000,
      jsonMode: true,
    });

    const parsed = parseJson<Omit<CommandCenterReport, "generatedAt">>(text);
    if (!parsed) throw new Error("Failed to generate daily brief. Please try again.");

    // Ensure exactly 3 recs, alerts have ids
    const recs = (parsed.recommendations ?? []).slice(0, 3);
    const alerts = (parsed.alerts ?? []).map((a, i) => ({
      ...a,
      id: a.id || `alert-${i}-${Date.now()}`,
    }));

    return {
      ...parsed,
      alerts,
      recommendations: recs,
      generatedAt: new Date().toISOString(),
    };
  });
