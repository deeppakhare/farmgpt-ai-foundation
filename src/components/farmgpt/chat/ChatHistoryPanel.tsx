import { useState } from "react";
import { MessageSquare, Pin, Pencil, Trash2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CONVERSATIONS, type ConversationSummary } from "@/lib/chat-mocks";

export function ChatHistoryPanel({
  activeId,
  onSelect,
  onNew,
}: {
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [items, setItems] = useState<ConversationSummary[]>(CONVERSATIONS);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const filtered = items.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));
  const pinned = filtered.filter((c) => c.pinned);
  const rest = filtered.filter((c) => !c.pinned);

  const rename = (id: string, title: string) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    setEditingId(null);
  };
  const del = (id: string) => setItems((prev) => prev.filter((c) => c.id !== id));
  const togglePin = (id: string) =>
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Button
        onClick={onNew}
        className="w-full justify-start gap-2 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
      >
        <Plus className="h-4 w-4" /> New chat
      </Button>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats"
          className="h-9 border-white/5 bg-white/5 pl-8 text-sm"
        />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {pinned.length > 0 && (
          <>
            <SectionLabel>Pinned</SectionLabel>
            <div className="space-y-0.5">
              {pinned.map((c) => (
                <Row
                  key={c.id}
                  c={c}
                  active={c.id === activeId}
                  editing={editingId === c.id}
                  draft={draft}
                  onDraft={setDraft}
                  onClick={() => onSelect(c.id)}
                  onStartEdit={() => {
                    setEditingId(c.id);
                    setDraft(c.title);
                  }}
                  onCommit={() => rename(c.id, draft.trim() || c.title)}
                  onCancel={() => setEditingId(null)}
                  onPin={() => togglePin(c.id)}
                  onDelete={() => del(c.id)}
                />
              ))}
            </div>
          </>
        )}
        <SectionLabel>Recent</SectionLabel>
        <div className="space-y-0.5">
          {rest.map((c) => (
            <Row
              key={c.id}
              c={c}
              active={c.id === activeId}
              editing={editingId === c.id}
              draft={draft}
              onDraft={setDraft}
              onClick={() => onSelect(c.id)}
              onStartEdit={() => {
                setEditingId(c.id);
                setDraft(c.title);
              }}
              onCommit={() => rename(c.id, draft.trim() || c.title)}
              onCancel={() => setEditingId(null)}
              onPin={() => togglePin(c.id)}
              onDelete={() => del(c.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">No chats match "{q}"</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pt-3 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </div>
  );
}

function Row({
  c,
  active,
  editing,
  draft,
  onDraft,
  onClick,
  onStartEdit,
  onCommit,
  onCancel,
  onPin,
  onDelete,
}: {
  c: ConversationSummary;
  active: boolean;
  editing: boolean;
  draft: string;
  onDraft: (v: string) => void;
  onClick: () => void;
  onStartEdit: () => void;
  onCommit: () => void;
  onCancel: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
        active ? "bg-white/5 text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
      )}
    >
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onBlur={onCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommit();
              if (e.key === "Escape") onCancel();
            }}
            className="min-w-0 flex-1 rounded bg-white/10 px-1.5 py-0.5 text-sm text-foreground outline-none ring-1 ring-accent/40"
          />
        ) : (
          <div className="min-w-0 flex-1">
            <div className="truncate">{c.title}</div>
          </div>
        )}
        {!editing && <span className="shrink-0 text-[10px] text-muted-foreground/70">{c.updatedAt}</span>}
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <IconBtn onClick={onPin} icon={Pin} active={!!c.pinned} label="Pin" />
        <IconBtn onClick={onStartEdit} icon={Pencil} label="Rename" />
        <IconBtn onClick={onDelete} icon={Trash2} label="Delete" danger />
      </div>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  onClick,
  label,
  active,
  danger,
}: {
  icon: any;
  onClick: () => void;
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground",
        active && "text-accent",
        danger && "hover:text-rose-300",
      )}
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}
