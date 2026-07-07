import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReportKind =
  | "farm-plan"
  | "market-intelligence"
  | "command-center"
  | "weather"
  | "disease-scan"
  | "general";

export interface SavedReport {
  id: string;
  title: string;
  kind: ReportKind;
  summary: string | null;
  size_bytes: number | null;
  created_at: string;
  pdfBase64?: string | null;
}

export interface ActivityRow {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  created_at: string;
}

export const saveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      title: string;
      kind: ReportKind;
      summary?: string;
      pdfBase64: string; // raw base64 (no data: prefix)
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const size = Math.floor((data.pdfBase64.length * 3) / 4);
    const { data: row, error } = await context.supabase
      .from("reports")
      .insert({
        user_id: context.userId,
        title: data.title,
        kind: data.kind,
        summary: data.summary ?? null,
        size_bytes: size,
        data: { pdfBase64: data.pdfBase64 } as never,
      })
      .select("id, title, kind, summary, size_bytes, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row as SavedReport;
  });

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reports")
      .select("id, title, kind, summary, size_bytes, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedReport[];
  });

export const getReportPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("reports")
      .select("id, title, data")
      .eq("user_id", context.userId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Report not found");
    const payload = row.data as { pdfBase64?: string } | null;
    if (!payload?.pdfBase64) throw new Error("This report has no PDF attached");
    return { title: row.title as string, pdfBase64: payload.pdfBase64 };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("reports")
      .delete()
      .eq("user_id", context.userId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: string; title: string; detail?: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("activity_log").insert({
      user_id: context.userId,
      kind: data.kind,
      title: data.title,
      detail: data.detail ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("activity_log")
      .select("id, kind, title, detail, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return (data ?? []) as ActivityRow[];
  });
