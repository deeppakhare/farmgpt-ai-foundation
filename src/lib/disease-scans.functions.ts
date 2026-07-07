import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { JsonValue } from "./agents/types";

export interface DiseaseScanRow {
  id: string;
  crop: string | null;
  diseaseName: string;
  severity: string | null;
  confidence: number | null;
  emergencyLevel: string | null;
  intro: string | null;
  blocks: JsonValue[];
  imageDataUrl: string | null;
  createdAt: string;
}

interface SaveInput {
  crop?: string | null;
  diseaseName: string;
  severity?: string | null;
  confidence?: number | null;
  emergencyLevel?: string | null;
  intro?: string | null;
  blocks: JsonValue[];
  imageDataUrl?: string | null;
}

export const listDiseaseScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DiseaseScanRow[]> => {
    const { data, error } = await context.supabase
      .from("disease_scans")
      .select(
        "id, crop, disease_name, severity, confidence, emergency_level, intro, blocks, image_data_url, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      crop: (r.crop as string | null) ?? null,
      diseaseName: r.disease_name as string,
      severity: (r.severity as string | null) ?? null,
      confidence: (r.confidence as number | null) ?? null,
      emergencyLevel: (r.emergency_level as string | null) ?? null,
      intro: (r.intro as string | null) ?? null,
      blocks: (r.blocks as JsonValue[]) ?? [],
      imageDataUrl: (r.image_data_url as string | null) ?? null,
      createdAt: r.created_at as string,
    }));
  });

export const saveDiseaseScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SaveInput) => data)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { data: row, error } = await context.supabase
      .from("disease_scans")
      .insert({
        user_id: context.userId,
        crop: data.crop ?? null,
        disease_name: data.diseaseName,
        severity: data.severity ?? null,
        confidence: data.confidence ?? null,
        emergency_level: data.emergencyLevel ?? null,
        intro: data.intro ?? null,
        blocks: data.blocks as never,
        image_data_url: data.imageDataUrl ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteDiseaseScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("disease_scans")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
