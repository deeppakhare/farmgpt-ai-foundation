import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import {
  createChat,
  appendMessage,
  getChatMessages,
  renameChat,
} from "@/lib/chat/chat.functions";

type ChatSearch = { c?: string };

export const Route = createFileRoute("/_workspace/chat")({
  validateSearch: (s: Record<string, unknown>): ChatSearch => ({
    c: typeof s.c === "string" ? s.c : undefined,
  }),
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
  const { c: chatIdFromUrl } = Route.useSearch();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(chatIdFromUrl);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const localChatIdsRef = useRef<Set<string>>(new Set());

  const routeIntentFn = useServerFn(routeIntent);
  const generalFn = useServerFn(runGeneralAgent);
  const diseaseFn = useServerFn(runDiseaseAgent);
  const weatherFn = useServerFn(runWeatherAgent);
  const marketFn = useServerFn(runMarketAgent);
  const govFn = useServerFn(runGovernmentAgent);
  const fertilizerFn = useServerFn(runFertilizerAgent);
  const createChatFn = useServerFn(createChat);
  const appendMessageFn = useServerFn(appendMessage);
  const getChatMessagesFn = useServerFn(getChatMessages);
  const renameChatFn = useServerFn(renameChat);

  const agentMap: Record<Exclude<AgentName, "intent-router">, typeof diseaseFn> = {
    "general-agent": generalFn,
    "disease-agent": diseaseFn,
    "weather-agent": weatherFn,
    "market-agent": marketFn,
    "government-agent": govFn,
    "fertilizer-agent": fertilizerFn,
  };

  // Load chat when URL param changes
  useEffect(() => {
    setChatId(chatIdFromUrl);
    if (!chatIdFromUrl) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getChatMessagesFn({ data: { chatId: chatIdFromUrl } })
      .then((r) => {
        if (cancelled) return;
        setMessages(r.messages);
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "Could not load conversation");
        void navigate({ to: "/chat", search: {} });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatIdFromUrl]);

  const [rotationSeed, setRotationSeed] = useState(0);
  useEffect(() => {
    if (messages.length > 0) return;
    const t = setInterval(() => setRotationSeed((s) => s + 1), 12000);
    return () => clearInterval(t);
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming]);

  const send = useCallback(
    async (text: string, atts: Attachment[]) => {
      if (!text && atts.length === 0) return;
      const attachmentsMeta = atts.map((a) => ({ name: a.name, kind: a.kind }));
      const userMsg: ChatMessage = {
        id: `u${Date.now()}`,
        role: "user",
        text: text || "(attachment)",
        attachments: attachmentsMeta,
      };
      setMessages((prev) => [...prev, userMsg]);
      setPrompt("");
      setStreaming(true);
      abortRef.current = false;

      // Ensure we have a chat row
      let activeChatId = chatId;
      const isFirstMessage = !activeChatId;
      try {
        if (!activeChatId) {
          const title = (text || "New conversation").slice(0, 60);
          const created = await createChatFn({ data: { title } });
          activeChatId = created.id;
          setChatId(activeChatId);
          void navigate({ to: "/chat", search: { c: activeChatId } });
        }

        // Persist user message
        await appendMessageFn({
          data: {
            chatId: activeChatId,
            role: "user",
            content: userMsg.text,
            metadata: attachmentsMeta.length ? { attachments: attachmentsMeta } : undefined,
          },
        }).catch(() => {});

        const firstImage = atts.find((a) => a.kind === "image" && a.url);
        const imageUrl = firstImage?.url
          ? await blobUrlToBase64DataUrl(firstImage.url)
          : undefined;

        const message = text || "Please analyze the attached image.";
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
        const finalBlocks = blocks.length ? blocks : [{ kind: "markdown", text: "" } as Block];
        const assistantText = finalBlocks
          .map((b) => (b.kind === "markdown" ? b.text : ""))
          .join("\n\n")
          .trim() || (response.content ?? "");

        setMessages((prev) => [
          ...prev,
          { id: `a${Date.now()}`, role: "assistant", blocks: finalBlocks },
        ]);

        await appendMessageFn({
          data: {
            chatId: activeChatId,
            role: "assistant",
            content: assistantText,
            metadata: { blocks: finalBlocks, agent },
          },
        }).catch(() => {});

        // Auto-generate a nicer title from the first user message
        if (isFirstMessage) {
          const cleanTitle = (text || "Conversation")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 60);
          if (cleanTitle) {
            void renameChatFn({ data: { chatId: activeChatId, title: cleanTitle } });
          }
        }
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId],
  );

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
            {chatId ? "Conversation" : messages.length > 0 ? "New chat" : "Ask FarmGPT anything"}
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            FarmGPT · your farming assistant
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading conversation…
            </div>
          ) : messages.length === 0 ? (
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
              placeholder="Ask FarmGPT — try 'yellow spots on my tomato leaves' or tap 🎤 to speak"
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              💡 Tip: You can send a photo of a leaf, speak your question, or share your location for better advice.
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
