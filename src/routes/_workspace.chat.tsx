import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatComposer, type Attachment } from "@/components/farmgpt/chat/ChatComposer";
import { AssistantMessage, TypingIndicator, UserMessage } from "@/components/farmgpt/chat/Message";
import { ChatEmptyState } from "@/components/farmgpt/chat/EmptyState";
import { QUICK_PROMPTS, type Block, type ChatMessage } from "@/lib/chat-mocks";
import { routeIntent } from "@/lib/agents/intent-router.functions";
import { runGeneralAgent } from "@/lib/agents/general-agent.functions";
import { runDiseaseAgent } from "@/lib/agents/disease-agent.functions";
import { runWeatherAgent } from "@/lib/agents/weather-agent.functions";
import { runMarketAgent } from "@/lib/agents/market-agent.functions";
import { runGovernmentAgent } from "@/lib/agents/government-agent.functions";
import { runFertilizerAgent } from "@/lib/agents/fertilizer-agent.functions";
import type { AgentName } from "@/lib/agents/types";

export const Route = createFileRoute("/_workspace/chat")({
  component: ChatPage,
});

async function blobUrlToBase64DataUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [activeConv, setActiveConv] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  const routeIntentFn = useServerFn(routeIntent);
  const generalFn = useServerFn(runGeneralAgent);
  const diseaseFn = useServerFn(runDiseaseAgent);
  const weatherFn = useServerFn(runWeatherAgent);
  const marketFn = useServerFn(runMarketAgent);
  const govFn = useServerFn(runGovernmentAgent);
  const fertilizerFn = useServerFn(runFertilizerAgent);

  const agentMap: Record<Exclude<AgentName, "intent-router">, typeof diseaseFn> = {
    "general-agent": generalFn,
    "disease-agent": diseaseFn,
    "weather-agent": weatherFn,
    "market-agent": marketFn,
    "government-agent": govFn,
    "fertilizer-agent": fertilizerFn,
  };

  const [rotationSeed, setRotationSeed] = useState(0);
  useEffect(() => {
    if (messages.length > 0) return;
    const t = setInterval(() => setRotationSeed((s) => s + 1), 12000);
    return () => clearInterval(t);
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming]);

  const send = async (text: string, atts: Attachment[]) => {
    if (!text && atts.length === 0) return;
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: "user",
      text: text || "(attachment)",
      attachments: atts.map((a) => ({ name: a.name, kind: a.kind })),
    };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setStreaming(true);
    abortRef.current = false;

    try {
      const firstImage = atts.find((a) => a.kind === "image" && a.url);
      const imageUrl = firstImage?.url
        ? await blobUrlToBase64DataUrl(firstImage.url)
        : undefined;

      const message = text || "Please analyze the attached image.";

      // If the user attached an image, always route to the vision disease agent.
      const agent = imageUrl
        ? ("disease-agent" as const)
        : (await routeIntentFn({ data: { message } })).agent;
      if (abortRef.current) return;

      const agentFn = agentMap[agent as Exclude<AgentName, "intent-router">] ?? generalFn;
      const response = await agentFn({ data: { message, imageUrl } });
      if (abortRef.current) return;

      const extraBlocks = Array.isArray(response.blocks) ? (response.blocks as Block[]) : [];
      const blocks: Block[] = [];
      if (response.content) blocks.push({ kind: "markdown", text: response.content });
      blocks.push(...extraBlocks);
      setMessages((prev) => [
        ...prev,
        {
          id: `a${Date.now()}`,
          role: "assistant",
          blocks: blocks.length ? blocks : [{ kind: "markdown", text: "" }],
        },
      ]);
    } catch (err) {
      if (!abortRef.current) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) => [
          ...prev,
          {
            id: `a${Date.now()}`,
            role: "assistant",
            blocks: [{ kind: "markdown", text: `⚠️ ${msg}` }],
          },
        ]);
      }
    } finally {
      setStreaming(false);
    }
  };

  const startNew = () => {
    setMessages([]);
    setActiveConv(undefined);
  };

  const selectConv = (id: string) => {
    setActiveConv(id);
    setMessages([]);
  };

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user") as
      | Extract<ChatMessage, { role: "user" }>
      | undefined;
    if (!lastUser) return;
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === lastUser.id);
      return idx >= 0 ? prev.slice(0, idx) : prev;
    });
    void send(lastUser.text, []);
  };

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground">
            {activeConv ? "Conversation" : messages.length > 0 ? "New chat" : "Start a conversation"}
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            FarmGPT · v2 preview
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            <ChatEmptyState onPick={(q) => setPrompt(q)} />
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
              {messages.map((m) =>
                m.role === "user" ? (
                  <UserMessage key={m.id} m={m} />
                ) : (
                  <AssistantMessage
                    key={m.id}
                    m={m}
                    onRegenerate={regenerate}
                    onFollowup={(q) => void send(q, [])}
                  />
                ),
              )}
              {streaming && <TypingIndicator />}
            </div>
          )}
        </div>

        <div className="border-t border-white/5 bg-background/60 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-4 md:px-6">
            {messages.length > 0 && !streaming && (
              <QuickChips seed={rotationSeed} onPick={(q) => setPrompt(q)} />
            )}
            <ChatComposer
              value={prompt}
              onChange={setPrompt}
              onSend={(t, a) => void send(t, a)}
              onStop={() => {
                abortRef.current = true;
                setStreaming(false);
              }}
              isStreaming={streaming}
              autoFocus
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              FarmGPT can make mistakes. Verify important agricultural decisions with an expert.
              <span className="mx-2 text-muted-foreground/40">·</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1 text-[10px]">Enter</kbd> to send ·{" "}
              <kbd className="rounded border border-white/10 bg-white/5 px-1 text-[10px]">Shift + Enter</kbd> for
              newline
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickChips({ seed, onPick }: { seed: number; onPick: (q: string) => void }) {
  const start = seed % QUICK_PROMPTS.length;
  const chips = [...QUICK_PROMPTS.slice(start), ...QUICK_PROMPTS.slice(0, start)].slice(0, 4);
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {chips.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.label}
            onClick={() => onPick(c.prompt)}
            className={cn(
              "glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground",
            )}
          >
            <Icon className="h-3 w-3 text-accent" />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
