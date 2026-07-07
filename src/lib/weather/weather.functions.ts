import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Types ────────────────────────────────────────────────────────────────

export interface WeatherHour {
  time: string; // ISO
  tempC: number;
  precipProb: number;
  code: number;
}
export interface WeatherDay {
  date: string; // ISO date
  tempMaxC: number;
  tempMinC: number;
  precipProb: number;
  uvMax: number;
  code: number;
}
export interface WeatherCurrent {
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windKph: number;
  precipMm: number;
  precipProb: number;
  uvIndex: number;
  code: number;
  isDay: boolean;
}
export interface WeatherLocation {
  name: string;
  region?: string;
  country?: string;
  lat: number;
  lng: number;
  timezone: string;
}
export interface WeatherAdvisory {
  summary: string;
  irrigation: { action: string; reason: string; level: "Skip" | "Reduce" | "Normal" | "Increase" };
  spray: { action: string; reason: string; safe: boolean };
  diseaseRisk: { level: "Low" | "Medium" | "High"; note: string };
  pestRisk: { level: "Low" | "Medium" | "High"; note: string };
  heatStress: { warning: boolean; note: string };
  frost: { warning: boolean; note: string };
  todayActivities: string[];
  tomorrowActivities: string[];
}
export interface WeatherIntelResult {
  location: WeatherLocation;
  current: WeatherCurrent;
  hourly: WeatherHour[];
  daily: WeatherDay[]; // 3 days on WeatherAPI free plan
  advisory: WeatherAdvisory;
  fetchedAt: string;
}

interface Input {
  lat?: number;
  lng?: number;
  place?: string;
  crops?: string[];
}

// ─── WeatherAPI.com ───────────────────────────────────────────────────────
// Docs: https://www.weatherapi.com/docs/  (free plan = 3-day forecast)

interface WAResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    precip_mm: number;
    uv: number;
    is_day: number;
    condition: { code: number };
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        daily_chance_of_rain: number;
        uv: number;
        condition: { code: number };
      };
      hour: Array<{
        time: string; // "YYYY-MM-DD HH:mm"
        time_epoch: number;
        temp_c: number;
        chance_of_rain: number;
        condition: { code: number };
      }>;
    }>;
  };
}

// Map WeatherAPI condition codes → Open-Meteo-ish codes the UI already handles.
// Fallback: return the WeatherAPI code; the UI's icon helper treats unknown
// codes as "cloudy" which is a safe default.
function mapConditionCode(waCode: number): number {
  // Common mappings
  const map: Record<number, number> = {
    1000: 0, // Sunny / Clear
    1003: 2, // Partly cloudy
    1006: 3, // Cloudy
    1009: 3, // Overcast
    1030: 45, // Mist
    1063: 61, // Patchy rain possible
    1066: 71, // Patchy snow possible
    1069: 66, // Patchy sleet possible
    1072: 66, // Patchy freezing drizzle
    1087: 95, // Thundery outbreaks
    1114: 71, // Blowing snow
    1117: 75, // Blizzard
    1135: 45, // Fog
    1147: 48, // Freezing fog
    1150: 51, // Patchy light drizzle
    1153: 53, // Light drizzle
    1168: 56, // Freezing drizzle
    1171: 57, // Heavy freezing drizzle
    1180: 61, // Patchy light rain
    1183: 61, // Light rain
    1186: 63, // Moderate rain at times
    1189: 63, // Moderate rain
    1192: 65, // Heavy rain at times
    1195: 65, // Heavy rain
    1198: 66, // Light freezing rain
    1201: 67, // Moderate/heavy freezing rain
    1204: 68, // Light sleet
    1207: 69, // Moderate/heavy sleet
    1210: 71, // Patchy light snow
    1213: 71, // Light snow
    1216: 73, // Patchy moderate snow
    1219: 73, // Moderate snow
    1222: 75, // Patchy heavy snow
    1225: 75, // Heavy snow
    1237: 77, // Ice pellets
    1240: 80, // Light rain shower
    1243: 81, // Moderate/heavy rain shower
    1246: 82, // Torrential rain shower
    1249: 85, // Light sleet showers
    1252: 86, // Moderate/heavy sleet showers
    1255: 85, // Light snow showers
    1258: 86, // Moderate/heavy snow showers
    1261: 77, // Light ice pellet showers
    1264: 77, // Moderate/heavy ice pellet showers
    1273: 95, // Patchy light rain with thunder
    1276: 96, // Moderate/heavy rain with thunder
    1279: 95, // Patchy light snow with thunder
    1282: 96, // Moderate/heavy snow with thunder
  };
  return map[waCode] ?? 3;
}

async function pinToCoords(pin: string): Promise<{ lat: number; lng: number; name: string; region?: string } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/in/${pin}`);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      places?: Array<{ "place name": string; state?: string; latitude: string; longitude: string }>;
    };
    const p = j.places?.[0];
    if (!p) return null;
    return {
      lat: parseFloat(p.latitude),
      lng: parseFloat(p.longitude),
      name: `${p["place name"]} (${pin})`,
      region: p.state,
    };
  } catch {
    return null;
  }
}

async function fetchWeatherAPI(q: string, apiKey: string): Promise<WAResponse> {
  const url =
    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}` +
    `&q=${encodeURIComponent(q)}&days=3&aqi=no&alerts=no`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WeatherAPI error [${res.status}]: ${body}`);
  }
  return (await res.json()) as WAResponse;
}

// ─── AI advisory (unchanged) ──────────────────────────────────────────────

const ADVISORY_SYSTEM = `You are FarmGPT's Weather Intelligence advisor for Indian farmers.
You are given ONLY structured weather JSON (from a live weather API) and the farmer's crop profile.
Do NOT invent, adjust, or estimate any weather numbers. Base every conclusion strictly
on the provided JSON.

Return ONLY valid JSON matching this schema (no prose, no markdown):
{
  "summary": string,
  "irrigation": { "action": string, "reason": string, "level": "Skip"|"Reduce"|"Normal"|"Increase" },
  "spray": { "action": string, "reason": string, "safe": boolean },
  "diseaseRisk": { "level": "Low"|"Medium"|"High", "note": string },
  "pestRisk":    { "level": "Low"|"Medium"|"High", "note": string },
  "heatStress":  { "warning": boolean, "note": string },
  "frost":       { "warning": boolean, "note": string },
  "todayActivities":    string[],
  "tomorrowActivities": string[]
}

Rules:
- Use the crop profile to tailor advice.
- If rain probability is high in next 6-12h → recommend skipping irrigation and delaying spraying.
- If wind > 15 km/h → spraying is not safe (drift).
- If daily min temp ≤ 4°C → frost warning true.
- If daily max temp ≥ 38°C or feels-like ≥ 40°C → heat stress warning true.
- High humidity (>80%) with warm temp (>22°C) → higher fungal disease risk.
- Keep language simple and Indian-farmer friendly.`;

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

function fallbackAdvisory(): WeatherAdvisory {
  return {
    summary: "Live weather retrieved. Detailed AI advisory unavailable right now — showing raw forecast.",
    irrigation: { action: "Check soil moisture manually", reason: "AI advisory unavailable", level: "Normal" },
    spray: { action: "Use standard judgement based on wind & rain", reason: "AI advisory unavailable", safe: true },
    diseaseRisk: { level: "Low", note: "No AI assessment available." },
    pestRisk: { level: "Low", note: "No AI assessment available." },
    heatStress: { warning: false, note: "" },
    frost: { warning: false, note: "" },
    todayActivities: [],
    tomorrowActivities: [],
  };
}

async function generateAdvisory(weatherJson: unknown, crops: string[] | undefined): Promise<WeatherAdvisory> {
  const { callGemini } = await import("@/lib/ai/gemini.server");
  const cropLine = crops && crops.length ? crops.join(", ") : "General mixed farming (not specified)";
  try {
    const { text } = await callGemini({
      system: ADVISORY_SYSTEM,
      prompt:
        `Farmer's crop profile: ${cropLine}\n\n` +
        `Live weather JSON (source of truth — do not change):\n${JSON.stringify(weatherJson)}\n\n` +
        `Return the JSON advisory now.`,
      temperature: 0.2,
      maxOutputTokens: 1200,
      jsonMode: true,
    });
    const parsed = parseJson<WeatherAdvisory>(text);
    return parsed ?? fallbackAdvisory();
  } catch (e) {
    console.error("Weather advisory failed", e);
    return fallbackAdvisory();
  }
}

// ─── Server function ──────────────────────────────────────────────────────

export const getWeatherIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Input) => data)
  .handler(async ({ data }): Promise<WeatherIntelResult> => {
    const apiKey = process.env.WEATHERAPI_KEY;
    if (!apiKey) {
      throw new Error("Weather service is not configured. Missing WEATHERAPI_KEY.");
    }

    // Resolve the WeatherAPI query string `q`.
    let q: string;
    let overrideName: string | undefined;
    let overrideRegion: string | undefined;

    if (data.place) {
      const trimmed = data.place.trim();
      if (/^\d{6}$/.test(trimmed)) {
        // Indian PIN — WeatherAPI's postal support is US/UK/CA only.
        const pin = await pinToCoords(trimmed);
        if (!pin) {
          throw new Error(
            `Couldn't find PIN "${trimmed}". Try a nearby city or village name, or use auto-detect.`,
          );
        }
        q = `${pin.lat},${pin.lng}`;
        overrideName = pin.name;
        overrideRegion = pin.region;
      } else {
        q = trimmed;
      }
    } else if (typeof data.lat === "number" && typeof data.lng === "number") {
      q = `${data.lat},${data.lng}`;
    } else {
      q = "Bengaluru";
    }

    const wa = await fetchWeatherAPI(q, apiKey);

    const location: WeatherLocation = {
      name: overrideName ?? wa.location.name,
      region: overrideRegion ?? wa.location.region,
      country: wa.location.country,
      lat: wa.location.lat,
      lng: wa.location.lon,
      timezone: wa.location.tz_id,
    };

    const current: WeatherCurrent = {
      tempC: wa.current.temp_c,
      feelsLikeC: wa.current.feelslike_c,
      humidity: wa.current.humidity,
      windKph: wa.current.wind_kph,
      precipMm: wa.current.precip_mm,
      precipProb: wa.forecast.forecastday[0]?.day.daily_chance_of_rain ?? 0,
      uvIndex: wa.current.uv,
      code: mapConditionCode(wa.current.condition.code),
      isDay: wa.current.is_day === 1,
    };

    // Flatten hourly across the 3 days, keep the next 24 from "now".
    const nowSec = wa.location.localtime_epoch;
    const allHours = wa.forecast.forecastday.flatMap((d) => d.hour);
    const hourly: WeatherHour[] = allHours
      .filter((h) => h.time_epoch >= nowSec - 3600)
      .slice(0, 24)
      .map((h) => ({
        time: h.time.replace(" ", "T"),
        tempC: h.temp_c,
        precipProb: h.chance_of_rain,
        code: mapConditionCode(h.condition.code),
      }));

    const daily: WeatherDay[] = wa.forecast.forecastday.map((d) => ({
      date: d.date,
      tempMaxC: d.day.maxtemp_c,
      tempMinC: d.day.mintemp_c,
      precipProb: d.day.daily_chance_of_rain,
      uvMax: d.day.uv,
      code: mapConditionCode(d.day.condition.code),
    }));

    const aiPayload = {
      location: {
        name: location.name,
        region: location.region,
        country: location.country,
        timezone: location.timezone,
      },
      current,
      hourly: hourly.slice(0, 12),
      daily,
    };

    const advisory = await generateAdvisory(aiPayload, data.crops);

    return {
      location,
      current,
      hourly,
      daily,
      advisory,
      fetchedAt: new Date().toISOString(),
    };
  });
