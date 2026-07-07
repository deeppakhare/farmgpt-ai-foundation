import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Block, ChatMessage } from "@/lib/chat-mocks";

export interface ChatSummary {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
  preview: string | null;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** List all chats for the current user (most recent first). */
export const listChats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: chats, error } = await context.supabase
      .from("chat_history")
      .select("id, title, updated_at, created_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    if (!chats?.length) return [] as ChatSummary[];

    // Fetch last user message as preview per chat (small N, one round-trip).
    const ids = chats.map((c) => c.id);
    const { data: msgs } = await context.supabase
      .from("chat_messages")
      .select("chat_id, content, role, created_at")
      .in("chat_id", ids)
      .eq("role", "user")
      .order("created_at", { ascending: false });
    const previewMap = new Map<string, string>();
    for (const m of msgs ?? []) {
      if (!previewMap.has(m.chat_id as string)) {
        previewMap.set(m.chat_id as string, (m.content as string).slice(0, 120));
      }
    }
    return chats.map((c) => ({
      ...c,
      preview: previewMap.get(c.id) ?? null,
    })) as ChatSummary[];
  });

/** Search chats by keyword across titles and message contents. */
export const searchChats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ data, context }) => {
    const q = data.q.trim();
    if (!q) return [] as ChatSummary[];
    const like = `%${q.replace(/[%_]/g, "\\$&")}%`;

    const [{ data: byTitle }, { data: byMsg }] = await Promise.all([
      context.supabase
        .from("chat_history")
        .select("id, title, updated_at, created_at")
        .eq("user_id", context.userId)
        .ilike("title", like)
        .order("updated_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("chat_messages")
        .select("chat_id, content, created_at, chat_history!inner(id, title, updated_at, created_at, user_id)")
        .eq("user_id", context.userId)
        .ilike("content", like)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const map = new Map<string, ChatSummary>();
    for (const c of byTitle ?? []) {
      map.set(c.id, { ...c, preview: null } as ChatSummary);
    }
    for (const m of byMsg ?? []) {
      const h = (m as { chat_history: { id: string; title: string; updated_at: string; created_at: string } }).chat_history;
      if (!h) continue;
      if (!map.has(h.id)) {
        map.set(h.id, {
          id: h.id,
          title: h.title,
          updated_at: h.updated_at,
          created_at: h.created_at,
          preview: (m.content as string).slice(0, 140),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.updated_at < b.updated_at ? 1 : -1,
    );
  });

/** Fetch all messages for a chat. */
export const getChatMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chatId: string }) => d)
  .handler(async ({ data, context }) => {
    // Verify ownership
    const { data: chat } = await context.supabase
      .from("chat_history")
      .select("id, title")
      .eq("id", data.chatId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!chat) throw new Error("Chat not found");

    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, metadata, created_at")
      .eq("chat_id", data.chatId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const messages: ChatMessage[] = (rows ?? []).map((r) => {
      if (r.role === "user") {
        const meta = (r.metadata as { attachments?: { name: string; kind: "image" | "pdf" }[] } | null) ?? null;
        return {
          id: r.id as string,
          role: "user" as const,
          text: r.content as string,
          attachments: meta?.attachments,
        };
      }
      const meta = (r.metadata as { blocks?: Block[] } | null) ?? null;
      const blocks: Block[] = meta?.blocks ?? [{ kind: "markdown", text: r.content as string }];
      return { id: r.id as string, role: "assistant" as const, blocks };
    });
    return { chat: { id: chat.id as string, title: chat.title as string }, messages };
  });

/** Create a new empty chat. */
export const createChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chat_history")
      .insert({ user_id: context.userId, title: data.title?.slice(0, 80) || "New chat" })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string; title: string; created_at: string; updated_at: string };
  });

/** Append a message to a chat. Returns the stored row id. */
export const appendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      chatId: string;
      role: "user" | "assistant";
      content: string;
      metadata?: Record<string, unknown>;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chat_messages")
      .insert({
        chat_id: data.chatId,
        user_id: context.userId,
        role: data.role,
        content: data.content,
        metadata: (data.metadata ?? null) as never,
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);

    // Bump chat updated_at
    await context.supabase
      .from("chat_history")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.chatId)
      .eq("user_id", context.userId);

    return row as { id: string; created_at: string };
  });

/** Rename a chat. */
export const renameChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chatId: string; title: string }) => d)
  .handler(async ({ data, context }) => {
    const title = data.title.trim().slice(0, 80) || "New chat";
    const { error } = await context.supabase
      .from("chat_history")
      .update({ title })
      .eq("id", data.chatId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, title };
  });

/** Delete a chat and all its messages (cascade). */
export const deleteChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chatId: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_history")
      .delete()
      .eq("id", data.chatId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
