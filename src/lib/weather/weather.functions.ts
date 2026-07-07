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
  hourly: WeatherHour[]; // next ~24h
  daily: WeatherDay[]; // 7 days
  advisory: WeatherAdvisory;
  fetchedAt: string;
}

interface Input {
  lat?: number;
  lng?: number;
  place?: string;
  crops?: string[];
}

// ─── Open-Meteo helpers ───────────────────────────────────────────────────

async function geocode(place: string): Promise<WeatherLocation | null> {
  const trimmed = place.trim();

  // Indian PIN code (6 digits) — Open-Meteo geocoding doesn't handle postal
  // codes, so fall back to zippopotam.us for a name + lat/lng.
  if (/^\d{6}$/.test(trimmed)) {
    try {
      const res = await fetch(`https://api.zippopotam.us/in/${trimmed}`);
      if (res.ok) {
        const j = (await res.json()) as {
          "post code": string;
          country: string;
          places?: Array<{
            "place name": string;
            state?: string;
            latitude: string;
            longitude: string;
          }>;
        };
        const p = j.places?.[0];
        if (p) {
          return {
            name: `${p["place name"]} (${trimmed})`,
            region: p.state,
            country: j.country,
            lat: parseFloat(p.latitude),
            lng: parseFloat(p.longitude),
            timezone: "Asia/Kolkata",
          };
        }
      }
    } catch {
      // fall through to name-based geocoding
    }
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = (await res.json()) as {
    results?: Array<{
      name: string;
      admin1?: string;
      country?: string;
      latitude: number;
      longitude: number;
      timezone: string;
    }>;
  };
  const r = j.results?.[0];
  if (!r) return null;
  return {
    name: r.name,
    region: r.admin1,
    country: r.country,
    lat: r.latitude,
    lng: r.longitude,
    timezone: r.timezone,
  };
}


async function reverseGeocode(lat: number, lng: number): Promise<Partial<WeatherLocation>> {
  // Try Open-Meteo first (fast, but often empty for rural / non-major spots).
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lng}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const j = (await res.json()) as {
        results?: Array<{ name: string; admin1?: string; country?: string; timezone?: string }>;
      };
      const r = j.results?.[0];
      if (r?.name) {
        return { name: r.name, region: r.admin1, country: r.country, timezone: r.timezone };
      }
    }
  } catch {
    // fall through
  }

  // Fallback: BigDataCloud free reverse geocoding (no API key, works everywhere).
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const j = (await res.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
      };
      const name = j.city || j.locality || j.principalSubdivision;
      if (name) {
        return { name, region: j.principalSubdivision, country: j.countryName };
      }
    }
  } catch {
    // fall through
  }

  return {};
}

interface OMResponse {
  timezone: string;
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
    uv_index?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
    weather_code: number[];
  };
}

async function fetchForecast(lat: number, lng: number): Promise<OMResponse> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,` +
    `wind_speed_10m,weather_code,is_day,uv_index` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max` +
    `&forecast_days=7&timezone=auto&wind_speed_unit=kmh`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return (await res.json()) as OMResponse;
}

// ─── AI advisory ──────────────────────────────────────────────────────────

const ADVISORY_SYSTEM = `You are FarmGPT's Weather Intelligence advisor for Indian farmers.
You are given ONLY structured weather JSON (from a live weather API) and the farmer's crop profile.
Do NOT invent, adjust, or estimate any weather numbers. Base every conclusion strictly
on the provided JSON.

Return ONLY valid JSON matching this schema (no prose, no markdown):
{
  "summary": string,                                           // 1-2 sentence farmer-friendly overview
  "irrigation": { "action": string, "reason": string, "level": "Skip"|"Reduce"|"Normal"|"Increase" },
  "spray": { "action": string, "reason": string, "safe": boolean },
  "diseaseRisk": { "level": "Low"|"Medium"|"High", "note": string },
  "pestRisk":    { "level": "Low"|"Medium"|"High", "note": string },
  "heatStress":  { "warning": boolean, "note": string },
  "frost":       { "warning": boolean, "note": string },
  "todayActivities":    string[],   // 3-5 concrete, prioritized actions for today
  "tomorrowActivities": string[]    // 3-5 concrete, prioritized actions for tomorrow
}

Rules:
- Use the crop profile to tailor advice (e.g., paddy vs tomato vs wheat).
- If rain probability is high in next 6-12h → recommend skipping irrigation and delaying spraying.
- If wind > 15 km/h → spraying is not safe (drift).
- If daily min temp ≤ 4°C → frost warning true.
- If daily max temp ≥ 38°C or feels-like ≥ 40°C → heat stress warning true.
- High humidity (>80%) with warm temp (>22°C) → higher fungal disease risk.
- Keep language simple, practical, Indian-farmer friendly.`;

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

async function generateAdvisory(
  weatherJson: unknown,
  crops: string[] | undefined,
): Promise<WeatherAdvisory> {
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
    let location: WeatherLocation | null = null;

    if (data.place) {
      location = await geocode(data.place);
      if (!location) {
        throw new Error(
          `Couldn't find "${data.place}". Try a city or village name (e.g. "Aurangabad") instead of a PIN code, or use auto-detect.`,
        );
      }
    } else if (typeof data.lat === "number" && typeof data.lng === "number") {
      const rev = await reverseGeocode(data.lat, data.lng);
      location = {
        name: rev.name ?? `${data.lat.toFixed(2)}, ${data.lng.toFixed(2)}`,
        region: rev.region,
        country: rev.country,
        lat: data.lat,
        lng: data.lng,
        timezone: rev.timezone ?? "auto",
      };
    } else {
      // Sensible default: Bengaluru
      location = {
        name: "Bengaluru",
        region: "Karnataka",
        country: "India",
        lat: 12.9716,
        lng: 77.5946,
        timezone: "Asia/Kolkata",
      };
    }

    const om = await fetchForecast(location.lat, location.lng);
    location.timezone = om.timezone || location.timezone;

    const current: WeatherCurrent = {
      tempC: om.current.temperature_2m,
      feelsLikeC: om.current.apparent_temperature,
      humidity: om.current.relative_humidity_2m,
      windKph: om.current.wind_speed_10m,
      precipMm: om.current.precipitation,
      precipProb: om.hourly.precipitation_probability?.[0] ?? 0,
      uvIndex: om.current.uv_index ?? om.daily.uv_index_max?.[0] ?? 0,
      code: om.current.weather_code,
      isDay: om.current.is_day === 1,
    };

    // Next ~24 hourly points starting from now
    const nowMs = Date.now();
    const hourly: WeatherHour[] = om.hourly.time
      .map((t, i) => ({
        time: t,
        tempC: om.hourly.temperature_2m[i],
        precipProb: om.hourly.precipitation_probability?.[i] ?? 0,
        code: om.hourly.weather_code[i],
      }))
      .filter((h) => new Date(h.time).getTime() >= nowMs - 60 * 60 * 1000)
      .slice(0, 24);

    const daily: WeatherDay[] = om.daily.time.map((d, i) => ({
      date: d,
      tempMaxC: om.daily.temperature_2m_max[i],
      tempMinC: om.daily.temperature_2m_min[i],
      precipProb: om.daily.precipitation_probability_max?.[i] ?? 0,
      uvMax: om.daily.uv_index_max?.[i] ?? 0,
      code: om.daily.weather_code[i],
    }));

    // Trim the JSON sent to AI to only the structured, meaningful fields.
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
