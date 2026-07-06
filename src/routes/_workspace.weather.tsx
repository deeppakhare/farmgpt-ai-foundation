import { createFileRoute } from "@tanstack/react-router";
import { Cloud, CloudRain, CloudSun, Droplets, Sun, Wind, Gauge, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_workspace/weather")({
  component: Weather,
});

const HOURLY = [
  { t: "Now", tmp: 28, icon: Sun },
  { t: "1 PM", tmp: 30, icon: Sun },
  { t: "2 PM", tmp: 31, icon: CloudSun },
  { t: "3 PM", tmp: 30, icon: CloudSun },
  { t: "4 PM", tmp: 29, icon: Cloud },
  { t: "5 PM", tmp: 27, icon: CloudRain },
  { t: "6 PM", tmp: 26, icon: CloudRain },
  { t: "7 PM", tmp: 25, icon: Cloud },
];

const DAILY = [
  { d: "Today", hi: 31, lo: 22, icon: CloudSun, rain: 20 },
  { d: "Tue", hi: 32, lo: 23, icon: Sun, rain: 5 },
  { d: "Wed", hi: 30, lo: 22, icon: CloudRain, rain: 70 },
  { d: "Thu", hi: 28, lo: 21, icon: CloudRain, rain: 85 },
  { d: "Fri", hi: 29, lo: 21, icon: Cloud, rain: 40 },
  { d: "Sat", hi: 31, lo: 22, icon: CloudSun, rain: 15 },
  { d: "Sun", hi: 33, lo: 23, icon: Sun, rain: 5 },
];

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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

function Weather() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <Card className="glass border-0 overflow-hidden">
        <div className="bg-gradient-hero p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Bengaluru, Karnataka</div>
              <div className="mt-1 font-display text-6xl font-semibold tracking-tight md:text-7xl">28°</div>
              <div className="mt-1 text-sm text-muted-foreground">Partly cloudy • Feels like 30°</div>
            </div>
            <CloudSun className="h-24 w-24 text-accent drop-shadow-[0_10px_30px_oklch(0.72_0.18_158/0.35)]" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
            <Metric icon={Droplets} label="Humidity" value="68%" />
            <Metric icon={Wind} label="Wind" value="12 km/h" />
            <Metric icon={CloudRain} label="Rain" value="20%" />
            <Metric icon={Sun} label="UV Index" value="7 High" />
            <Metric icon={Gauge} label="Air Quality" value="42 Good" />
            <Metric icon={Eye} label="Visibility" value="10 km" />
          </div>
        </div>
      </Card>

      <Card className="glass mt-6 border-0">
        <CardContent className="p-5">
          <h2 className="font-display text-base font-semibold">Hourly forecast</h2>
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-8">
            {HOURLY.map((h) => (
              <div key={h.t} className="flex flex-col items-center rounded-lg border border-border/60 bg-white/[0.02] p-3">
                <div className="text-xs text-muted-foreground">{h.t}</div>
                <h.icon className="my-2 h-6 w-6 text-accent" />
                <div className="text-sm font-medium">{h.tmp}°</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass mt-6 border-0">
        <CardContent className="p-5">
          <h2 className="font-display text-base font-semibold">7-day forecast</h2>
          <div className="mt-3 divide-y divide-border/60">
            {DAILY.map((d) => (
              <div key={d.d} className="flex items-center gap-4 py-3">
                <div className="w-16 text-sm">{d.d}</div>
                <d.icon className="h-5 w-5 text-accent" />
                <div className="flex-1 text-xs text-muted-foreground">Rain {d.rain}%</div>
                <div className="text-sm"><span className="font-medium">{d.hi}°</span> <span className="text-muted-foreground">{d.lo}°</span></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
