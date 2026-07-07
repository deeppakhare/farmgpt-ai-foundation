import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Cloud,
  CloudRain,
  CloudSun,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Droplets,
  Sun,
  Wind,
  Gauge,
  Eye,
  MapPin,
  Loader2,
  RefreshCw,
  Search,
  Sprout,
  Bug,
  ShieldAlert,
  Snowflake,
  Flame,
  SprayCan,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getWeatherIntelligence,
  type WeatherIntelResult,
  type WeatherAdvisory,
  type WeatherDay,
  type WeatherHour,
} from "@/lib/weather/weather.functions";

export const Route = createFileRoute("/_workspace/weather")({
  component: WeatherPage,
});

// ─── weather code → icon + label ──────────────────────────────────────────

function codeToIcon(code: number) {
  if (code === 0) return Sun;
  if ([1, 2].includes(code)) return CloudSun;
  if (code === 3) return Cloud;
  if ([45, 48].includes(code)) return CloudFog;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return Cloud;
}
function codeToLabel(code: number) {
  const map: Record<number, string> = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm",
  };
  return map[code] ?? "—";
}

// ─── formatters ───────────────────────────────────────────────────────────

function fmtHour(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric" });
}
function fmtDay(iso: string, idx: number) {
  if (idx === 0) return "Today";
  return new Date(iso).toLocaleDateString([], { weekday: "short" });
}

// ─── small UI helpers ─────────────────────────────────────────────────────

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white/[0.03] p-3">
      <div className="rounded-lg bg-accent/15 p-2 text-accent"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function levelColor(level: string) {
  const l = level.toLowerCase();
  if (l === "high" || l === "increase") return "bg-destructive/15 text-destructive border-destructive/30";
  if (l === "medium" || l === "reduce") return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  if (l === "skip") return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
}

function AdvisoryCard({
  icon: Icon,
  title,
  badge,
  badgeTone = "normal",
  body,
  reason,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  badgeTone?: "normal" | "level";
  body: string;
  reason?: string;
}) {
  return (
    <Card className="glass border-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent/15 p-2 text-accent"><Icon className="h-4 w-4" /></div>
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          {badge && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                badgeTone === "level" ? levelColor(badge) : "border-accent/40 bg-accent/10 text-accent",
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed">{body}</p>
        {reason && <p className="mt-1.5 text-xs text-muted-foreground">{reason}</p>}
      </CardContent>
    </Card>
  );
}

function ActivityList({ icon: Icon, title, items }: { icon: React.ComponentType<{ className?: string }>; title: string; items: string[] }) {
  return (
    <Card className="glass border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-accent/15 p-2 text-accent"><Icon className="h-4 w-4" /></div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No specific recommendations.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────

function WeatherPage() {
  const weatherFn = useServerFn(getWeatherIntelligence);
  const [data, setData] = useState<WeatherIntelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeInput, setPlaceInput] = useState("");
  const [usingGeo, setUsingGeo] = useState(false);

  const load = useCallback(
    async (args: { lat?: number; lng?: number; place?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await weatherFn({ data: args });
        setData(res);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Failed to load weather.");
      } finally {
        setLoading(false);
      }
    },
    [weatherFn],
  );

  // Always try to use the user's live location on page visit / refresh.
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location access. Search a place to continue.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUsingGeo(true);
        void load({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        // Permission denied / unavailable — don't silently fall back to a hardcoded city.
        setLoading(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access blocked. Enable location in your browser to see weather for your area, or search a place below."
            : "Couldn't detect your location. Search a place below to continue.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = placeInput.trim();
    if (!p) return;
    setUsingGeo(false);
    void load({ place: p });
  };

  const advisory: WeatherAdvisory | null = data?.advisory ?? null;
  const CurrentIcon = useMemo(() => (data ? codeToIcon(data.current.code) : CloudSun), [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      {/* Location bar */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {data ? (
            <span>
              {data.location.name}
              {data.location.region ? `, ${data.location.region}` : ""}
              {data.location.country ? `, ${data.location.country}` : ""}
              {usingGeo && <span className="ml-2 text-xs text-accent">• auto-detected</span>}
            </span>
          ) : (
            <span>Detecting your location…</span>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              placeholder="Search city or village…"
              className="w-64 pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={loading}>Go</Button>
          {data && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void load({ lat: data.location.lat, lng: data.location.lng })}
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          )}
        </form>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {loading && !data ? (
        <Card className="glass border-0">
          <CardContent className="flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Fetching live weather & AI advisory…
          </CardContent>
        </Card>
      ) : data ? (
        <>
          {/* Current */}
          <Card className="glass overflow-hidden border-0">
            <div className="bg-gradient-hero p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {data.location.name}{data.location.region ? `, ${data.location.region}` : ""}
                  </div>
                  <div className="mt-1 font-display text-6xl font-semibold tracking-tight md:text-7xl">
                    {Math.round(data.current.tempC)}°
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {codeToLabel(data.current.code)} • Feels like {Math.round(data.current.feelsLikeC)}°
                  </div>
                </div>
                <CurrentIcon className="h-24 w-24 text-accent drop-shadow-[0_10px_30px_oklch(0.72_0.18_158/0.35)]" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
                <Metric icon={Droplets} label="Humidity" value={`${Math.round(data.current.humidity)}%`} />
                <Metric icon={Wind} label="Wind" value={`${Math.round(data.current.windKph)} km/h`} />
                <Metric icon={CloudRain} label="Rain" value={`${Math.round(data.current.precipProb)}%`} />
                <Metric icon={Sun} label="UV Index" value={`${Math.round(data.current.uvIndex)}`} />
                <Metric icon={Gauge} label="Precip" value={`${data.current.precipMm.toFixed(1)} mm`} />
                <Metric icon={Eye} label="Updated" value={new Date(data.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
              </div>
            </div>
          </Card>

          {/* AI advisory */}
          {advisory && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Sprout className="h-4 w-4 text-accent" />
                <h2 className="font-display text-base font-semibold">AI Farming Advisory</h2>
                <Badge variant="outline" className="border-accent/40 bg-accent/10 text-[10px] uppercase tracking-wide text-accent">
                  Live weather · AI reasoning
                </Badge>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{advisory.summary}</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <AdvisoryCard
                  icon={Droplets}
                  title="Irrigation"
                  badge={advisory.irrigation.level}
                  badgeTone="level"
                  body={advisory.irrigation.action}
                  reason={advisory.irrigation.reason}
                />
                <AdvisoryCard
                  icon={SprayCan}
                  title="Spraying"
                  badge={advisory.spray.safe ? "Safe" : "Not safe"}
                  badgeTone="level"
                  body={advisory.spray.action}
                  reason={advisory.spray.reason}
                />
                <AdvisoryCard
                  icon={ShieldAlert}
                  title="Disease risk"
                  badge={advisory.diseaseRisk.level}
                  badgeTone="level"
                  body={advisory.diseaseRisk.note}
                />
                <AdvisoryCard
                  icon={Bug}
                  title="Pest risk"
                  badge={advisory.pestRisk.level}
                  badgeTone="level"
                  body={advisory.pestRisk.note}
                />
                <AdvisoryCard
                  icon={Flame}
                  title="Heat stress"
                  badge={advisory.heatStress.warning ? "Warning" : "OK"}
                  badgeTone="level"
                  body={advisory.heatStress.note || "No heat stress expected."}
                />
                <AdvisoryCard
                  icon={Snowflake}
                  title="Frost"
                  badge={advisory.frost.warning ? "Warning" : "OK"}
                  badgeTone="level"
                  body={advisory.frost.note || "No frost expected."}
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ActivityList icon={Calendar} title="Best activities today" items={advisory.todayActivities} />
                <ActivityList icon={Calendar} title="Best activities tomorrow" items={advisory.tomorrowActivities} />
              </div>
            </div>
          )}

          {/* Hourly */}
          <Card className="glass mt-6 border-0">
            <CardContent className="p-5">
              <h2 className="font-display text-base font-semibold">Hourly forecast · next 24h</h2>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {data.hourly.map((h: WeatherHour, i) => {
                  const Icon = codeToIcon(h.code);
                  return (
                    <div key={h.time} className="flex min-w-[76px] flex-col items-center rounded-lg border border-border/60 bg-white/[0.02] p-3">
                      <div className="text-xs text-muted-foreground">{i === 0 ? "Now" : fmtHour(h.time)}</div>
                      <Icon className="my-2 h-6 w-6 text-accent" />
                      <div className="text-sm font-medium">{Math.round(h.tempC)}°</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{h.precipProb}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Daily */}
          <Card className="glass mt-6 border-0">
            <CardContent className="p-5">
              <h2 className="font-display text-base font-semibold">7-day forecast</h2>
              <div className="mt-3 divide-y divide-border/60">
                {data.daily.map((d: WeatherDay, i) => {
                  const Icon = codeToIcon(d.code);
                  return (
                    <div key={d.date} className="flex items-center gap-4 py-3">
                      <div className="w-16 text-sm">{fmtDay(d.date, i)}</div>
                      <Icon className="h-5 w-5 text-accent" />
                      <div className="flex-1 text-xs text-muted-foreground">
                        Rain {d.precipProb}% · UV {Math.round(d.uvMax)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{Math.round(d.tempMaxC)}°</span>{" "}
                        <span className="text-muted-foreground">{Math.round(d.tempMinC)}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 text-center text-[11px] text-muted-foreground">
            Weather data from Open-Meteo · AI reasoning by FarmGPT
          </div>
        </>
      ) : null}
    </div>
  );
}
