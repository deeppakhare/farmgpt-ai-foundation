import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PromptBox } from "@/components/farmgpt/PromptBox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CloudRain, Sparkles, ArrowRight, CheckCircle2, Circle, FileBarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FARM_SUMMARY,
  QUICK_ACTIONS,
  SUGGESTED_QUESTIONS,
  RECENT_REPORTS,
  TODAYS_TASKS,
  toneClass,
} from "@/lib/farm-mocks";
import { useFarmer } from "@/hooks/useFarmer";

export const Route = createFileRoute("/_workspace/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const { name, greeting } = useFarmer();
  const navigate = useNavigate();

  const sendToChat = (text: string) => {
    const q = text.trim();
    if (!q) return;
    void navigate({ to: "/chat", search: { q } });
  };


  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      {/* Greeting */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {greeting}, <span className="text-gradient">{name}</span> <span className="inline-block">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Ready to help your farm today.</p>
      </motion.header>

      {/* Farm Summary */}
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {FARM_SUMMARY.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.03 * i }}
            >
              <Card className="glass border-0 h-full">
                <CardContent className="p-3.5">
                  <div className={cn("mb-2 inline-flex rounded-lg p-1.5", toneClass[c.tone])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {c.label}
                  </div>
                  <div className="mt-0.5 truncate font-display text-base font-semibold">{c.value}</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.hint}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </section>

      {/* Hero grid: AI recommendation (large) + Weather + Crop Health + Notifications */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Today's AI Recommendation — large */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-2"
        >
          <Card className="glass relative h-full overflow-hidden border-0">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
            <CardContent className="relative p-6 md:p-8">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
                <Sparkles className="h-3.5 w-3.5" /> Today's AI Recommendation
              </div>
              <h2 className="mt-3 font-display text-2xl leading-tight font-semibold md:text-3xl">
                🌧 Rain expected tomorrow — delay pesticide spraying until{" "}
                <span className="text-gradient">Thursday morning</span>.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
                Soil moisture is currently optimal at 62%. With 12mm of rain forecast overnight, foliar sprays applied
                today will wash off. Best irrigation window: <b className="text-foreground">tomorrow after 6 PM</b>.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full bg-white/5">Confidence 92%</Badge>
                <Badge variant="secondary" className="rounded-full bg-white/5">Source: IMD + soil sensors</Badge>
                <Badge variant="secondary" className="rounded-full bg-white/5">Crop: Tomato</Badge>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                  Apply to my schedule <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Ask a follow-up</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column: Weather (medium) + Crop Health (medium) stacked */}
        <div className="grid gap-4">
          <Card className="glass border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Weather · Hosakote</div>
                <CloudRain className="h-4 w-4 text-sky-300" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="font-display text-3xl font-semibold">29°</div>
                <div className="text-sm text-muted-foreground">Cloudy · feels 31°</div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[11px] text-muted-foreground">
                {[
                  { d: "Mon", t: "29°" },
                  { d: "Tue", t: "26°" },
                  { d: "Wed", t: "27°" },
                  { d: "Thu", t: "30°" },
                ].map((x) => (
                  <div key={x.d} className="rounded-lg bg-white/5 py-2">
                    <div>{x.d}</div>
                    <div className="mt-0.5 font-medium text-foreground">{x.t}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardContent className="p-5">
              <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Crop Health</div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="font-display text-3xl font-semibold">86</div>
                <div className="text-sm text-emerald-300">/ 100 · Healthy</div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Minor leaf-curl signs on rows 4–7. Scout tomorrow morning.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Wide: Today's tasks */}
      <section className="mb-6">
        <Card className="glass border-0">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-display text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Today's Tasks
              </div>
              <Badge variant="secondary" className="rounded-full bg-white/5">
                {TODAYS_TASKS.filter((t) => !t.done).length} pending
              </Badge>
            </div>
            <ul className="grid gap-2 md:grid-cols-2">
              {TODAYS_TASKS.map((t) => (
                <li
                  key={t.title}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5"
                >
                  {t.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-sm", t.done && "text-muted-foreground line-through")}>
                      {t.title}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{t.time}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Quick actions above prompt */}
      <section className="mb-3">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Quick actions</div>
          <div className="text-[11px] text-muted-foreground hidden sm:block">Tap to prefill your prompt</div>
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
      <section className="mb-6">
        <PromptBox value={prompt} onChange={setPrompt} onSend={sendToChat} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          FarmGPT can make mistakes. Verify important agricultural decisions with an expert.
        </p>
      </section>

      {/* Empty-state helpers: suggested + recent reports */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="glass border-0">
          <CardContent className="p-5">
            <div className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Suggested questions
            </div>
            <ul className="space-y-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <li key={q}>
                  <button
                    onClick={() => sendToChat(q)}

                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <span className="truncate">{q}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Recent reports
              </div>
              <Link to="/reports" className="text-[11px] text-accent hover:underline">View all</Link>
            </div>
            <ul className="space-y-1">
              {RECENT_REPORTS.map((r, i) => (
                <li key={r.title}>
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                    <div className="rounded-lg bg-white/5 p-2 text-accent">
                      <FileBarChart2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{r.date}</div>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-white/5 text-[10px]">
                      {r.status}
                    </Badge>
                  </div>
                  {i < RECENT_REPORTS.length - 1 && <Separator className="bg-white/5" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
