import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MarketInput {
  crop: string;
  variety: string;
  state: string;
  district: string;
  quantityQuintal: number;
}

export interface NearbyMarket {
  name: string;
  distanceKm: number;
  pricePerQuintal: number;
  demand: "High" | "Medium" | "Low";
  arrivalQuintal: number;
}

export interface PriceTrendPoint {
  date: string; // ISO
  price: number; // per quintal INR
}

export interface AiAdvisory {
  action: "SELL_TODAY" | "WAIT";
  actionReason: string;
  trendAnalysis: string;
  bestMarket: string;
  bestMarketReason: string;
  transportation: string;
  expectedProfit: number;
  profitBreakdown: string;
  riskFactors: string[];
  confidence: number; // 0-100
}

export interface MarketReport {
  crop: string;
  variety: string;
  state: string;
  district: string;
  quantityQuintal: number;

  currentPrice: number; // per quintal INR
  msp?: number;
  priceChangePct: number; // vs 7 days ago
  unit: string; // "quintal"

  nearbyMarkets: NearbyMarket[];
  bestMarket: NearbyMarket;

  trend: PriceTrendPoint[]; // last 14 days
  forecast: PriceTrendPoint[]; // next 7 days
  expectedMovement: {
    direction: "up" | "down" | "flat";
    percent: number;
    horizonDays: number;
    summary: string;
  };

  advisory: AiAdvisory;
  generatedAt: string;
}

const SYSTEM = `You are FarmGPT's Market Intelligence AI for Indian farmers.
Given real-time-like mandi market data (current prices, nearby markets, 14-day price history and 7-day forecast) plus the farmer's crop, variety, location and quantity, produce an ADVISORY.

Return ONLY valid JSON (no markdown, no prose) matching:
{
  "action": "SELL_TODAY" | "WAIT",
  "actionReason": string,
  "trendAnalysis": string,
  "bestMarket": string,
  "bestMarketReason": string,
  "transportation": string,
  "expectedProfit": number,
  "profitBreakdown": string,
  "riskFactors": string[],
  "confidence": number
}

Rules:
- Base every claim on the provided data — do not invent prices.
- expectedProfit is total INR net for the given quantity after estimated transport & mandi cess.
- transportation: practical advice (vehicle type, approx cost per quintal, timing).
- riskFactors: 3-5 concrete risks (price volatility, weather, glut, storage loss).
- confidence: 0-100 based on trend clarity and price spread across markets.
- Keep every string concise, plain, farmer-friendly.`;

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

// Deterministic pseudo-random from string
function seed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

// Base price bands (INR/quintal) — realistic Indian mandi ranges.
const BASE_PRICE: Record<string, [number, number]> = {
  tomato: [1200, 3500],
  onion: [1500, 3800],
  potato: [900, 2200],
  wheat: [2100, 2700],
  paddy: [1900, 2400],
  rice: [2800, 4500],
  cotton: [6500, 8200],
  soybean: [4200, 5200],
  maize: [1900, 2400],
  sugarcane: [310, 400],
  groundnut: [5500, 7000],
  chilli: [12000, 22000],
  turmeric: [11000, 16000],
  gram: [4800, 6200],
  bajra: [2100, 2600],
  jowar: [2600, 3300],
  mustard: [5000, 6200],
  banana: [1400, 2500],
  mango: [3500, 6500],
};

function priceFor(crop: string, rand: () => number) {
  const key = crop.trim().toLowerCase();
  const band = BASE_PRICE[key] ?? [2000, 3500];
  return Math.round(band[0] + rand() * (band[1] - band[0]));
}

function generateMockMarketData(input: MarketInput): Omit<MarketReport, "advisory" | "generatedAt"> {
  const rand = seed(`${input.crop}|${input.variety}|${input.state}|${input.district}`);
  const current = priceFor(input.crop, rand);
  const change = (rand() - 0.4) * 12; // -4.8% .. +7.2%

  // 14-day trend
  const trend: PriceTrendPoint[] = [];
  const today = new Date();
  let p = current / (1 + change / 100);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    p = p * (1 + (rand() - 0.5) * 0.03);
    trend.push({ date: d.toISOString().slice(0, 10), price: Math.round(p) });
  }
  trend[trend.length - 1].price = current;

  // 7-day forecast
  const forecast: PriceTrendPoint[] = [];
  let fp = current;
  const drift = (rand() - 0.35) * 0.02; // slight upward bias
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    fp = fp * (1 + drift + (rand() - 0.5) * 0.02);
    forecast.push({ date: d.toISOString().slice(0, 10), price: Math.round(fp) });
  }

  const forecastEnd = forecast[forecast.length - 1].price;
  const movePct = ((forecastEnd - current) / current) * 100;
  const direction: "up" | "down" | "flat" = movePct > 1 ? "up" : movePct < -1 ? "down" : "flat";

  const marketNames = [
    `${input.district} APMC`,
    `${input.district} Mandi`,
    `${input.state} Central Market`,
    `Regional Wholesale Yard`,
    `${input.district} Sub-Yard`,
  ];
  const nearbyMarkets: NearbyMarket[] = marketNames.map((name, idx) => {
    const spread = (rand() - 0.5) * 0.15;
    return {
      name,
      distanceKm: Math.round(5 + rand() * 90),
      pricePerQuintal: Math.round(current * (1 + spread)),
      demand: rand() > 0.66 ? "High" : rand() > 0.33 ? "Medium" : "Low",
      arrivalQuintal: Math.round(50 + rand() * 950),
    } as NearbyMarket;
  }).sort((a, b) => b.pricePerQuintal - a.pricePerQuintal);

  const bestMarket = nearbyMarkets[0];

  return {
    crop: input.crop,
    variety: input.variety,
    state: input.state,
    district: input.district,
    quantityQuintal: input.quantityQuintal,
    currentPrice: current,
    priceChangePct: Math.round(change * 10) / 10,
    unit: "quintal",
    nearbyMarkets,
    bestMarket,
    trend,
    forecast,
    expectedMovement: {
      direction,
      percent: Math.round(movePct * 10) / 10,
      horizonDays: 7,
      summary:
        direction === "up"
          ? `Prices likely to rise ~${Math.abs(Math.round(movePct))}% over next 7 days`
          : direction === "down"
            ? `Prices likely to soften ~${Math.abs(Math.round(movePct))}% over next 7 days`
            : `Prices expected to stay flat over next 7 days`,
    },
  };
}

export const generateMarketReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: MarketInput) => data)
  .handler(async ({ data }): Promise<MarketReport> => {
    const { callGemini } = await import("@/lib/ai/gemini.server");
    const market = generateMockMarketData(data);

    const prompt = `Farmer input:
- Crop: ${data.crop}
- Variety: ${data.variety}
- Location: ${data.district}, ${data.state}
- Quantity to sell: ${data.quantityQuintal} quintal

Market data:
- Current price: ₹${market.currentPrice}/quintal (change vs last week: ${market.priceChangePct}%)
- Expected 7-day movement: ${market.expectedMovement.summary}
- Best market: ${market.bestMarket.name} at ₹${market.bestMarket.pricePerQuintal}/quintal (${market.bestMarket.distanceKm} km, demand ${market.bestMarket.demand})
- Nearby markets (top prices):
${market.nearbyMarkets
  .slice(0, 5)
  .map((m) => `  • ${m.name} — ₹${m.pricePerQuintal}/q, ${m.distanceKm} km, demand ${m.demand}, arrivals ${m.arrivalQuintal} q`)
  .join("\n")}
- 14-day trend (₹/q): ${market.trend.map((t) => t.price).join(", ")}
- 7-day forecast (₹/q): ${market.forecast.map((t) => t.price).join(", ")}

Generate the JSON advisory now.`;

    const { text } = await callGemini({
      system: SYSTEM,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 1400,
      jsonMode: true,
    });

    const advisory =
      parseJson<AiAdvisory>(text) ??
      ({
        action: market.expectedMovement.direction === "up" ? "WAIT" : "SELL_TODAY",
        actionReason: market.expectedMovement.summary,
        trendAnalysis: `Prices moved ${market.priceChangePct}% over last week.`,
        bestMarket: market.bestMarket.name,
        bestMarketReason: `Highest price ₹${market.bestMarket.pricePerQuintal}/q at ${market.bestMarket.distanceKm} km.`,
        transportation: "Use a mini-truck or shared tempo; budget ₹100-200/quintal for transport.",
        expectedProfit: Math.round(market.bestMarket.pricePerQuintal * data.quantityQuintal * 0.92),
        profitBreakdown: "Gross revenue less transport (~5%) and mandi cess (~3%).",
        riskFactors: ["Sudden weather change", "Market glut", "Transport delay"],
        confidence: 60,
      } as AiAdvisory);

    return { ...market, advisory, generatedAt: new Date().toISOString() };
  });
