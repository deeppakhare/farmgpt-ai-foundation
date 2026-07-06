import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PromptBox } from "@/components/farmgpt/PromptBox";
import { Logo } from "@/components/farmgpt/Logo";
import { useState } from "react";
import { Leaf, Droplets, CloudSun, Landmark, FlaskConical, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: Leaf, title: "Diagnose my crop disease", hint: "Upload a photo and get a fix" },
  { icon: Droplets, title: "Should I irrigate today?", hint: "Based on soil + weather" },
  { icon: CloudSun, title: "Weather forecast", hint: "7-day outlook for my farm" },
  { icon: Landmark, title: "Government schemes", hint: "Subsidies I qualify for" },
  { icon: FlaskConical, title: "Best fertilizer", hint: "For my soil and crop" },
  { icon: LineChart, title: "Market prices", hint: "Today's mandi rates" },
];

export const Route = createFileRoute("/_workspace/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [prompt, setPrompt] = useState("");
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center text-center">
        <Logo size="lg" showText={false} />
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          How can I help your <span className="text-gradient">farm</span> today?
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ask anything — from crop disease to weather, irrigation, and market prices.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-8">
        <PromptBox value={prompt} onChange={setPrompt} />
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.title}
              onClick={() => setPrompt(s.title)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.04 }}
              whileHover={{ y: -2 }}
              className={cn(
                "glass group flex items-start gap-3 rounded-xl p-3.5 text-left transition-colors hover:border-accent/40",
              )}
            >
              <div className="rounded-lg bg-white/5 p-2 text-accent group-hover:bg-accent/15">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{s.title}</div>
                <div className="truncate text-xs text-muted-foreground">{s.hint}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        FarmGPT can make mistakes. Verify important agricultural decisions with an expert.
      </p>
    </div>
  );
}
