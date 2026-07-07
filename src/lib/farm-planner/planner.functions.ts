import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PlannerInput {
  crop: string;
  state: string;
  district: string;
  landSizeAcres: number;
  soilType: string;
  irrigationSource: string;
  sowingDate: string; // ISO date
}

export interface CalendarStage {
  stage: string;
  startDate: string;
  endDate: string;
  activities: string[];
}
export interface IrrigationEvent {
  date: string;
  stage: string;
  method: string;
  quantity: string; // per acre
  notes: string;
}
export interface Product {
  name: string;
  price: string; // e.g. "₹450 for 500ml"
  quantityForLand: string; // total for given land size
  dosePer20LPump: string; // ml or g per 20L
  notes?: string;
}
export interface ScheduleItem {
  date: string;
  stage: string;
  problem?: string;
  purpose: string;
  options: Product[]; // 2 options
}
export interface HarvestInfo {
  fromDate: string;
  toDate: string;
  indicators: string[];
  postHarvest: string[];
}
export interface CostBreakdownItem {
  category: string;
  amount: number; // INR total
  detail: string;
}
export interface ProfitEstimate {
  yieldQuintalPerAcre: number;
  totalYieldQuintal: number;
  marketPricePerQuintal: number;
  grossRevenue: number;
  totalCost: number;
  netProfit: number;
  roiPercent: number;
  assumptions: string[];
}
export interface FarmPlan {
  summary: string;
  crop: string;
  location: string;
  landSizeAcres: number;
  season: string;
  calendar: CalendarStage[];
  irrigation: IrrigationEvent[];
  fertilizer: ScheduleItem[];
  pest: ScheduleItem[];
  disease: ScheduleItem[];
  harvest: HarvestInfo;
  costs: CostBreakdownItem[];
  profit: ProfitEstimate;
  tips: string[];
  generatedAt: string;
}

const SYSTEM = `You are FarmGPT's Seasonal Farm Planner for Indian farmers.
Given a crop, state, district, land size (acres), soil type, irrigation source and sowing date,
generate a COMPLETE seasonal plan tailored to that region and crop.

Return ONLY valid JSON (no markdown, no prose) matching this exact schema:
{
  "summary": string,
  "crop": string,
  "location": string,
  "landSizeAcres": number,
  "season": string,
  "calendar": [ { "stage": string, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "activities": string[] } ],
  "irrigation": [ { "date": "YYYY-MM-DD", "stage": string, "method": string, "quantity": string, "notes": string } ],
  "fertilizer": [ { "date": "YYYY-MM-DD", "stage": string, "purpose": string,
      "options": [ { "name": string, "price": string, "quantityForLand": string, "dosePer20LPump": string, "notes": string } ] } ],
  "pest": [ { "date": "YYYY-MM-DD", "stage": string, "problem": string, "purpose": string,
      "options": [ { "name": string, "price": string, "quantityForLand": string, "dosePer20LPump": string, "notes": string } ] } ],
  "disease": [ { "date": "YYYY-MM-DD", "stage": string, "problem": string, "purpose": string,
      "options": [ { "name": string, "price": string, "quantityForLand": string, "dosePer20LPump": string, "notes": string } ] } ],
  "harvest": { "fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD", "indicators": string[], "postHarvest": string[] },
  "costs": [ { "category": string, "amount": number, "detail": string } ],
  "profit": {
     "yieldQuintalPerAcre": number, "totalYieldQuintal": number,
     "marketPricePerQuintal": number, "grossRevenue": number,
     "totalCost": number, "netProfit": number, "roiPercent": number,
     "assumptions": string[]
  },
  "tips": string[]
}

Rules:
- All dates must be real dates derived from the sowing date.
- Calendar must cover the full cycle: land prep → sowing → vegetative → flowering → fruiting → maturity → harvest.
- Irrigation events: schedule 6-12 events across the season based on crop water needs, soil type and irrigation source.
- Fertilizer: 3-6 scheduled applications. Each entry MUST list exactly 2 product OPTIONS (branded or generic products commonly available in India) with:
    * price (₹, realistic Indian retail),
    * quantityForLand (total product needed for the farmer's land size),
    * dosePer20LPump (ml or g mixed into a standard 20-litre knapsack sprayer).
- Pest & Disease: 2-5 scheduled entries each with the same 2-option format. Include chemical + biological/organic option when possible.
- Costs: itemize seeds, land prep, fertilizer, pesticide, irrigation, labour, harvesting, misc. Amount is total INR for the whole land, not per acre.
- Profit: use realistic per-acre yield & mandi price for that crop & region. Show all calculations. netProfit = grossRevenue - totalCost.
- Use simple Indian-farmer friendly language. Keep every string concise.`;

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

export const generateFarmPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: PlannerInput) => data)
  .handler(async ({ data }): Promise<FarmPlan> => {
    const { callGemini } = await import("@/lib/ai/gemini.server");

    const prompt = `Farmer input:
- Crop: ${data.crop}
- State: ${data.state}
- District: ${data.district}
- Land size: ${data.landSizeAcres} acres
- Soil type: ${data.soilType}
- Irrigation source: ${data.irrigationSource}
- Sowing date: ${data.sowingDate}

Generate the complete seasonal plan JSON now.`;

    const { text } = await callGemini({
      system: SYSTEM,
      prompt,
      temperature: 0.4,
      maxOutputTokens: 6000,
      jsonMode: true,
    });

    const parsed = parseJson<FarmPlan>(text);
    if (!parsed) {
      throw new Error("Failed to generate farm plan. Please try again.");
    }
    return { ...parsed, generatedAt: new Date().toISOString() };
  });
