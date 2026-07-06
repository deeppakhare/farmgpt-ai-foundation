import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  Droplets,
  FlaskConical,
  Landmark,
  Leaf,
  LineChart,
  Sparkles,
  Sprout,
  Sun,
  Cloud,
  TrendingDown,
  TrendingUp,
  Scissors,
  Wheat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Block } from "@/lib/chat-mocks";

/* ─── Shared ─── */

function CardHeader({
  icon: Icon,
  eyebrow,
  title,
  tone = "emerald",
}: {
  icon: any;
  eyebrow: string;
  title: string;
  tone?: "emerald" | "sky" | "amber" | "violet" | "lime" | "rose";
}) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-300 bg-emerald-500/10",
    sky: "text-sky-300 bg-sky-500/10",
    amber: "text-amber-300 bg-amber-500/10",
    violet: "text-violet-300 bg-violet-500/10",
    lime: "text-lime-300 bg-lime-500/10",
    rose: "text-rose-300 bg-rose-500/10",
  };
  return (
    <div className="mb-3 flex items-start gap-3">
      <div className={cn("rounded-lg p-2", tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{eyebrow}</div>
        <div className="font-display text-base font-semibold leading-tight">{title}</div>
      </div>
    </div>
  );
}

/* ─── Markdown ─── */

export function MarkdownBlock({ text }: { text: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:tracking-tight prose-strong:text-foreground prose-code:rounded prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:border prose-pre:border-white/5 prose-pre:bg-black/40 prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-table:overflow-hidden prose-table:rounded-lg prose-table:border prose-table:border-white/5 prose-th:bg-white/5 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-td:border-t prose-td:border-white/5 prose-td:px-3 prose-td:py-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

/* ─── Diagnosis ─── */

export function DiagnosisCard({ b }: { b: Extract<Block, { kind: "diagnosis" }> }) {
  const severityTone =
    b.severity === "Severe" ? "text-rose-300" : b.severity === "Moderate" ? "text-amber-300" : "text-emerald-300";
  return (
    <Card className="glass border-0 overflow-hidden">
      <CardContent className="p-5">
        <CardHeader icon={Leaf} eyebrow="Diagnosis" title={`${b.crop} · ${b.disease}`} tone="emerald" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat label="Confidence" value={`${b.confidence}%`} />
          <Stat label="Severity" value={b.severity} valueClassName={severityTone} />
          <Stat label="Stage" value="Actionable" />
        </div>
        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Cause · </span>
          {b.cause}
        </div>
        <div className="mt-4">
          <div className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Treatment plan
          </div>
          <ol className="space-y-2">
            {b.treatment.map((t, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</div>
      <div className={cn("mt-0.5 font-display text-lg font-semibold", valueClassName)}>{value}</div>
    </div>
  );
}

/* ─── Weather ─── */

const weatherIcon = { sun: Sun, rain: CloudRain, cloud: Cloud } as const;

export function WeatherCard({ b }: { b: Extract<Block, { kind: "weather" }> }) {
  return (
    <Card className="glass border-0 overflow-hidden">
      <CardContent className="p-5">
        <CardHeader icon={CloudRain} eyebrow="Weather" title={b.location} tone="sky" />
        <div className="flex items-baseline gap-3">
          <div className="font-display text-4xl font-semibold">{b.current.temp}</div>
          <div className="text-sm text-muted-foreground">
            {b.current.cond} · feels {b.current.feels}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {b.days.map((d) => {
            const Icon = weatherIcon[d.icon];
            return (
              <div key={d.day} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                <div className="text-[11px] font-medium text-muted-foreground">{d.day}</div>
                <Icon className="mx-auto my-1.5 h-5 w-5 text-sky-300" />
                <div className="text-sm font-semibold">{d.hi}</div>
                <div className="text-[11px] text-muted-foreground">{d.lo}</div>
                <div className="mt-1 text-[10px] text-sky-300/80">💧 {d.rain}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">Advisory · </span>
            {b.advisory}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Recommendation ─── */

export function RecommendationCard({ b }: { b: Extract<Block, { kind: "recommendation" }> }) {
  return (
    <Card className="glass border-0 overflow-hidden">
      <CardContent className="p-5">
        <CardHeader icon={Sparkles} eyebrow="Recommendation" title={b.title} tone="emerald" />
        <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Confidence</span>
            <span className="font-medium text-foreground">{b.confidence}%</span>
          </div>
          <Progress value={b.confidence} className="h-1.5 bg-white/5" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {b.tags.map((t) => (
            <Badge key={t} variant="secondary" className="rounded-full bg-white/5">
              {t}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Risk ─── */

export function RiskCard({ b }: { b: Extract<Block, { kind: "risk" }> }) {
  const tone = b.level === "High" ? "rose" : b.level === "Moderate" ? "amber" : "emerald";
  return (
    <Card className={cn("glass border-0 overflow-hidden")}>
      <CardContent className="p-5">
        <CardHeader icon={AlertTriangle} eyebrow={`Risk · ${b.level}`} title={b.title} tone={tone as any} />
        <p className="text-sm text-muted-foreground">{b.body}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {b.mitigate.map((m, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              <span>{m}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Market ─── */

export function MarketCard({ b }: { b: Extract<Block, { kind: "market" }> }) {
  const Trend = b.trend === "up" ? TrendingUp : TrendingDown;
  const trendClass = b.trend === "up" ? "text-emerald-300" : "text-rose-300";
  return (
    <Card className="glass border-0 overflow-hidden">
      <CardContent className="p-5">
        <CardHeader icon={LineChart} eyebrow="Market" title={`${b.commodity} · ${b.unit}`} tone="lime" />
        <div className="flex items-baseline gap-3">
          <div className="font-display text-3xl font-semibold">{b.today}</div>
          <div className={cn("flex items-center gap-1 text-sm font-medium", trendClass)}>
            <Trend className="h-4 w-4" />
            {b.change}
          </div>
        </div>
        <div className="mt-4 divide-y divide-white/5 rounded-xl border border-white/5">
          {b.mandis.map((m) => (
            <div key={m.name} className="flex items-center justify-between px-3 py-2.5 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{m.name}</div>
                <div className="text-[11px] text-muted-foreground">{m.distance}</div>
              </div>
              <div className="font-semibold">{m.price}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Scheme ─── */

export function SchemeCard({ b }: { b: Extract<Block, { kind: "scheme" }> }) {
  return (
    <Card className="glass border-0 overflow-hidden">
      <CardContent className="p-5">
        <CardHeader icon={Landmark} eyebrow={`Scheme · ${b.agency}`} title={b.name} tone="violet" />
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3 text-sm">
          <span className="font-medium">Benefit · </span>
          <span className="text-muted-foreground">{b.benefit}</span>
        </div>
        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Eligibility
          </div>
          <ul className="space-y-1.5">
            {b.eligibility.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
                <span className="text-muted-foreground">{e}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-300">
          <CalendarDays className="h-3.5 w-3.5" />
          Deadline · {b.deadline}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Action Plan Timeline ─── */

const actionIcons = {
  water: Droplets,
  spray: FlaskConical,
  scout: Activity,
  harvest: Wheat,
  fertilize: Sprout,
} as const;

export function ActionPlan({ b }: { b: Extract<Block, { kind: "actionPlan" }> }) {
  return (
    <Card className="glass border-0 overflow-hidden">
      <CardContent className="p-5">
        <CardHeader icon={CalendarDays} eyebrow="Action plan" title="Your farm's next moves" tone="emerald" />
        <ol className="relative ml-2 space-y-3 border-l border-white/10 pl-5">
          {b.items.map((it, i) => {
            const Icon = actionIcons[it.icon];
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="relative"
              >
                <span className="absolute -left-[27px] top-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <Icon className="h-3 w-3" />
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <Badge variant="secondary" className="rounded-full bg-white/5 text-[10px]">
                    {it.when}
                  </Badge>
                  <div className="text-sm font-medium">{it.title}</div>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{it.detail}</div>
              </motion.li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

/* ─── Followups ─── */

export function FollowUps({
  questions,
  onPick,
}: {
  questions: string[];
  onPick: (q: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        Ask a follow-up
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="glass rounded-full px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Renderer ─── */

export function BlockRenderer({ block, onFollowup }: { block: Block; onFollowup: (q: string) => void }) {
  switch (block.kind) {
    case "markdown":
      return <MarkdownBlock text={block.text} />;
    case "diagnosis":
      return <DiagnosisCard b={block} />;
    case "weather":
      return <WeatherCard b={block} />;
    case "recommendation":
      return <RecommendationCard b={block} />;
    case "risk":
      return <RiskCard b={block} />;
    case "market":
      return <MarketCard b={block} />;
    case "scheme":
      return <SchemeCard b={block} />;
    case "actionPlan":
      return <ActionPlan b={block} />;
    case "followups":
      return <FollowUps questions={block.questions} onPick={onFollowup} />;
  }
}
