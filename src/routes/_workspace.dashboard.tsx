import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PromptBox } from "@/components/farmgpt/PromptBox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudRain, Sparkles, MapPin, Loader2 } from "lucide-react";
import { QUICK_ACTIONS } from "@/lib/farm-mocks";
import { useFarmer } from "@/hooks/useFarmer";

export const Route = createFileRoute("/_workspace/dashboard")({
  component: Dashboard,
});

type Weather = {
  tempC: number;
  code: number;
  description: string;
  place: string;
};

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const { name, greeting } = useFarmer();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<"idle" | "loading" | "denied" | "error" | "ok">("idle");

  const sendToChat = (text: string) => {
    const q = text.trim();
    if (!q) return;
    void navigate({ to: "/chat", search: { q } });
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setWeatherStatus("error");
      return;
    }
    setWeatherStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const [wxRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`,
            ),
            fetch(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`,
            ).catch(() => null),
          ]);
          const wx = await wxRes.json();
          const geo = geoRes ? await geoRes.json().catch(() => null) : null;
          const first = geo?.results?.[0];
          const place =
            [first?.name, first?.admin1].filter(Boolean).join(", ") ||
            `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          const code = wx?.current?.weather_code ?? 0;
          setWeather({
            tempC: Math.round(wx?.current?.temperature_2m ?? 0),
            code,
            description: WEATHER_CODES[code] ?? "—",
            place,
          });
          setWeatherStatus("ok");
        } catch {
          setWeatherStatus("error");
        }
      },
      () => setWeatherStatus("denied"),
      { timeout: 8000 },
    );
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-12">
      {/* Greeting */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {greeting}, <span className="text-gradient">{name}</span>{" "}
          <span className="inline-block">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask FarmGPT anything about your crops, weather, market prices, or government schemes.
        </p>
      </motion.header>

      {/* Live weather from user location */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8"
      >
        <Card className="glass relative overflow-hidden border-0">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
          <CardContent className="relative p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Live weather at your location
            </div>

            {weatherStatus === "loading" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching your local weather…
              </div>
            )}

            {weatherStatus === "denied" && (
              <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                Location access is blocked. Enable location to see real-time weather for your farm, or ask FarmGPT
                about weather for any city.
              </p>
            )}

            {weatherStatus === "error" && (
              <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                Couldn't load weather right now. You can still ask FarmGPT about the forecast for your village.
              </p>
            )}

            {weatherStatus === "ok" && weather && (
              <>
                <h2 className="mt-3 flex items-baseline gap-3 font-display text-3xl leading-tight font-semibold md:text-4xl">
                  {weather.tempC}°C
                  <span className="text-base font-normal text-muted-foreground">{weather.description}</span>
                </h2>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {weather.place}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full bg-white/5">
                    <CloudRain className="mr-1 h-3 w-3" /> Source: Open-Meteo
                  </Badge>
                </div>
                <p className="mt-5 max-w-2xl text-sm text-muted-foreground">
                  Want personalised farm advice based on this weather? Tap a quick action below or ask FarmGPT
                  directly.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Quick actions */}
      <section className="mb-4">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Quick actions</div>
          <div className="hidden text-[11px] text-muted-foreground sm:block">Tap to prefill your prompt</div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.button
                key={a.label}
                onClick={() => sendToChat(a.prompt)}
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.03 * i }}
                className="glass group flex items-center gap-2.5 rounded-xl p-3 text-left transition-colors hover:border-accent/40"
              >
                <div className="rounded-lg bg-white/5 p-2 text-accent group-hover:bg-accent/15">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="truncate text-sm font-medium">{a.label}</div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Prompt */}
      <section>
        <PromptBox value={prompt} onChange={setPrompt} onSend={sendToChat} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          FarmGPT can make mistakes. Verify important agricultural decisions with an expert.
        </p>
      </section>
    </div>
  );
}
