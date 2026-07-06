import { motion } from "framer-motion";
import { ArrowRight, CloudRain, FileBarChart2, Sprout } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/farmgpt/Logo";
import { useFarmer } from "@/hooks/useFarmer";
import { QUICK_PROMPTS } from "@/lib/chat-mocks";
import { RECENT_REPORTS } from "@/lib/farm-mocks";
import { cn } from "@/lib/utils";

const toneClass: Record<string, string> = {
  emerald: "text-emerald-300 bg-emerald-500/10 group-hover:bg-emerald-500/15",
  sky: "text-sky-300 bg-sky-500/10 group-hover:bg-sky-500/15",
  amber: "text-amber-300 bg-amber-500/10 group-hover:bg-amber-500/15",
  violet: "text-violet-300 bg-violet-500/10 group-hover:bg-violet-500/15",
  lime: "text-lime-300 bg-lime-500/10 group-hover:bg-lime-500/15",
};

export function ChatEmptyState({ onPick }: { onPick: (q: string) => void }) {
  const { name, greeting } = useFarmer();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
          <Logo showText={false} />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {greeting}, <span className="text-gradient">{name}</span>
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground md:text-base">
          Your AI farming co-pilot. Ask about crops, diseases, weather, market prices or schemes — or upload a crop
          image for instant diagnosis.
        </p>
      </motion.div>

      {/* Quick prompt cards */}
      <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_PROMPTS.slice(0, 6).map((q, i) => {
          const Icon = q.icon;
          return (
            <motion.button
              key={q.label}
              onClick={() => onPick(q.prompt)}
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.04 * i }}
              className="glass group flex items-start gap-3 rounded-2xl p-3.5 text-left transition-colors hover:border-accent/40"
            >
              <div className={cn("rounded-lg p-2 transition-colors", toneClass[q.tone])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{q.label}</div>
                <div className="truncate text-[11px] text-muted-foreground">{q.hint}</div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.button>
          );
        })}
      </div>

      {/* Farm widgets row */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Weather
              </div>
              <CloudRain className="h-4 w-4 text-sky-300" />
            </div>
            <div className="mt-1 font-display text-xl font-semibold">29° · Cloudy</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">Rain likely tomorrow</div>
          </CardContent>
        </Card>
        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Farm</div>
              <Sprout className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="mt-1 font-display text-xl font-semibold">Tomato · 4.5 ac</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">Flowering · Day 42</div>
          </CardContent>
        </Card>
        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Recent report
              </div>
              <FileBarChart2 className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-1 truncate font-display text-sm font-semibold">{RECENT_REPORTS[0].title}</div>
            <Badge variant="secondary" className="mt-1.5 rounded-full bg-white/5 text-[10px]">
              {RECENT_REPORTS[0].status}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
