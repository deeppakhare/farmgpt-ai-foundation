import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatComposer, type Attachment } from "@/components/farmgpt/chat/ChatComposer";
import { AssistantMessage, TypingIndicator, UserMessage } from "@/components/farmgpt/chat/Message";
import { ChatEmptyState } from "@/components/farmgpt/chat/EmptyState";
import { ChatHistoryPanel } from "@/components/farmgpt/chat/ChatHistoryPanel";
import { QUICK_PROMPTS, SEED_MESSAGES, type ChatMessage } from "@/lib/chat-mocks";

export const Route = createFileRoute("/_workspace/chat")({
  component: ChatPage,
});

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [activeConv, setActiveConv] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rotate quick prompt seed order every 12s on empty state
  const [rotationSeed, setRotationSeed] = useState(0);
  useEffect(() => {
    if (messages.length > 0) return;
    const t = setInterval(() => setRotationSeed((s) => s + 1), 12000);
    return () => clearInterval(t);
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming]);

  const send = (text: string, atts: Attachment[]) => {
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

    // Simulated stream: pick seed assistant reply after delay
    setTimeout(() => {
      const assistant = SEED_MESSAGES.find((m) => m.role === "assistant") as ChatMessage;
      setMessages((prev) => [...prev, { ...assistant, id: `a${Date.now()}` }]);
      setStreaming(false);
    }, 1400);
  };

  const startNew = () => {
    setMessages([]);
    setActiveConv(undefined);
  };

  const selectConv = (id: string) => {
    setActiveConv(id);
    // Load seed conversation as a demo
    setMessages(SEED_MESSAGES);
  };

  const regenerate = () => {
    setMessages((prev) => prev.slice(0, -1));
    setStreaming(true);
    setTimeout(() => {
      const assistant = SEED_MESSAGES.find((m) => m.role === "assistant") as ChatMessage;
      setMessages((prev) => [...prev, { ...assistant, id: `a${Date.now()}` }]);
      setStreaming(false);
    }, 1200);
  };

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* History rail */}
      <AnimatePresence initial={false}>
        {historyOpen && (
          <motion.aside
            key="history"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden shrink-0 overflow-hidden border-r border-white/5 md:block"
          >
            <div className="h-full w-[280px]">
              <ChatHistoryPanel activeId={activeConv} onSelect={selectConv} onNew={startNew} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-label="Toggle chat history"
          >
            {historyOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
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
                    onFollowup={(q) => send(q, [])}
                  />
                ),
              )}
              {streaming && <TypingIndicator />}
            </div>
          )}
        </div>

        {/* Composer + inline quick prompts */}
        <div className="border-t border-white/5 bg-background/60 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-4 md:px-6">
            {messages.length > 0 && !streaming && (
              <QuickChips seed={rotationSeed} onPick={(q) => setPrompt(q)} />
            )}
            <ChatComposer
              value={prompt}
              onChange={setPrompt}
              onSend={send}
              onStop={() => setStreaming(false)}
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
  // rotate window over QUICK_PROMPTS
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
