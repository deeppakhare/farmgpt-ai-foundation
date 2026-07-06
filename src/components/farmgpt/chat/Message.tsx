import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  RotateCcw,
  Share2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/farmgpt/Logo";
import type { ChatMessage } from "@/lib/chat-mocks";
import { BlockRenderer } from "./RichCards";

export function UserMessage({ m }: { m: Extract<ChatMessage, { role: "user" }> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end gap-3"
    >
      <div className="flex max-w-[85%] flex-col items-end gap-2 md:max-w-[70%]">
        {m.attachments && m.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {m.attachments.map((a) => (
              <div
                key={a.name}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pr-3 pl-1.5 text-xs"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                  {a.kind === "pdf" ? <FileText className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <span className="max-w-[160px] truncate">{a.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-2xl rounded-tr-md bg-gradient-primary px-4 py-2.5 text-[0.925rem] leading-relaxed text-primary-foreground shadow-glow">
          {m.text}
        </div>
      </div>
      <Avatar className="mt-1 h-8 w-8 shrink-0 ring-2 ring-primary/30">
        <AvatarFallback className="bg-white/10 text-xs text-foreground">You</AvatarFallback>
      </Avatar>
    </motion.div>
  );
}

export function AssistantMessage({
  m,
  onRegenerate,
  onFollowup,
}: {
  m: Extract<ChatMessage, { role: "assistant" }>;
  onRegenerate?: () => void;
  onFollowup: (q: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const copy = () => {
    const text = m.blocks
      .map((b) => (b.kind === "markdown" ? b.text : `[${b.kind}]`))
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex gap-3"
    >
      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow">
        <Logo showText={false} />
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        {m.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} onFollowup={onFollowup} />
        ))}
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <ActionBtn onClick={copy} icon={copied ? Check : Copy} label={copied ? "Copied" : "Copy"} />
          <ActionBtn onClick={onRegenerate} icon={RotateCcw} label="Regenerate" />
          <ActionBtn icon={Share2} label="Share" />
          <div className="mx-1 h-4 w-px bg-white/10" />
          <ActionBtn
            onClick={() => setFeedback((v) => (v === "up" ? null : "up"))}
            icon={ThumbsUp}
            active={feedback === "up"}
          />
          <ActionBtn
            onClick={() => setFeedback((v) => (v === "down" ? null : "down"))}
            icon={ThumbsDown}
            active={feedback === "down"}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: any;
  label?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-7 gap-1.5 rounded-full px-2.5 text-[11px] text-muted-foreground hover:bg-white/5 hover:text-foreground",
        active && "bg-accent/15 text-accent hover:bg-accent/20",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label && <span>{label}</span>}
    </Button>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow">
        <Logo showText={false} />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex gap-1">
            <Dot delay={0} />
            <Dot delay={0.15} />
            <Dot delay={0.3} />
          </span>
          <span>FarmGPT is thinking…</span>
        </div>
        <div className="glass space-y-2.5 rounded-2xl p-4">
          <Shimmer className="h-3 w-2/3" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-5/6" />
          <Shimmer className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </motion.div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
      animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 0.9, repeat: Infinity, delay }}
    />
  );
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/[0.04]",
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
