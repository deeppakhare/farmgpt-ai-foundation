import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  UploadCloud,
  Camera,
  ImageIcon,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { runDiseaseAgent } from "@/lib/agents/disease-agent.functions";
import {
  listDiseaseScans,
  saveDiseaseScan,
  deleteDiseaseScan,
  type DiseaseScanRow,
} from "@/lib/disease-scans.functions";
import { BlockRenderer } from "@/components/farmgpt/chat/RichCards";
import type { Block } from "@/lib/chat-mocks";
import type { JsonValue } from "@/lib/agents/types";

export const Route = createFileRoute("/_workspace/disease-scanner")({
  component: DiseaseScanner,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day && d.getDate() === now.getDate()) {
    return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffMs < 2 * day) return "Yesterday";
  return d.toLocaleDateString();
}

function extractVisionBlock(blocks: JsonValue[]): Record<string, JsonValue> | null {
  for (const b of blocks) {
    if (b && typeof b === "object" && !Array.isArray(b)) {
      const obj = b as Record<string, JsonValue>;
      if (obj.kind === "diseaseVision") return obj;
    }
  }
  return null;
}

function DiseaseScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intro, setIntro] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [history, setHistory] = useState<DiseaseScanRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selected, setSelected] = useState<DiseaseScanRow | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const diseaseFn = useServerFn(runDiseaseAgent);
  const listFn = useServerFn(listDiseaseScans);
  const saveFn = useServerFn(saveDiseaseScan);
  const deleteFn = useServerFn(deleteDiseaseScan);

  const refreshHistory = useCallback(async () => {
    try {
      const rows = await listFn();
      setHistory(rows);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const handleFile = useCallback((f: File | null) => {
    setFile(f);
    setBlocks([]);
    setIntro(null);
    setError(null);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }, []);

  const handleDiagnose = useCallback(async () => {
    setError(null);
    setBlocks([]);
    setIntro(null);

    if (!file) {
      setError("Please upload a clear photo of the affected crop before diagnosing.");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await fileToDataUrl(file);
      const response = await diseaseFn({
        data: { message: "Please diagnose this crop image.", imageUrl },
      });
      const respBlocks = (response.blocks ?? []) as JsonValue[];
      setIntro(response.content ?? null);
      setBlocks(respBlocks as unknown as Block[]);

      const vision = extractVisionBlock(respBlocks);
      if (vision) {
        try {
          await saveFn({
            data: {
              diseaseName: String(vision.diseaseName ?? "Unclear diagnosis"),
              severity: (vision.severity as string) ?? null,
              confidence:
                typeof vision.confidence === "number" ? vision.confidence : null,
              emergencyLevel: (vision.emergencyLevel as string) ?? null,
              intro: response.content ?? null,
              blocks: respBlocks,
              imageDataUrl: imageUrl,
            },
          });
          void refreshHistory();
        } catch (saveErr) {
          console.error("Failed to save scan", saveErr);
        }
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [file, diseaseFn, saveFn, refreshHistory]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteFn({ data: { id } });
        setHistory((h) => h.filter((r) => r.id !== id));
        if (selected?.id === id) setSelected(null);
      } catch (e) {
        console.error("Failed to delete scan", e);
      }
    },
    [deleteFn, selected],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Disease Scanner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo of an affected leaf or plant. FarmGPT will diagnose and suggest treatment.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="glass border-0">
          <CardContent className="p-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault(); setDrag(false);
                const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
              }}
              onClick={() => { if (!preview) fileInputRef.current?.click(); }}
              className={cn(
                "relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                drag ? "border-accent bg-accent/5" : "border-border hover:border-accent/60 hover:bg-white/[0.02]",
              )}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="max-h-72 rounded-lg object-contain" />
                  <Button variant="ghost" size="sm" className="mt-3" onClick={(e) => { e.stopPropagation(); handleFile(null); }}>
                    <X className="mr-1.5 h-4 w-4" /> Remove
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-gradient-primary p-3 shadow-glow">
                    <UploadCloud className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="mt-4 font-medium">Drag & drop an image</div>
                  <div className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 10MB</div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      <ImageIcon className="mr-1.5 h-4 w-4" />Browse
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                    >
                      <Camera className="mr-1.5 h-4 w-4" />Camera
                    </Button>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file" accept="image/*" className="sr-only"
                onChange={(e) => { handleFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
              />
              <input
                ref={cameraInputRef}
                type="file" accept="image/*" capture="environment" className="sr-only"
                onChange={(e) => { handleFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
              />
            </div>

            <Button
              onClick={handleDiagnose}
              className="mt-4 w-full bg-gradient-primary text-primary-foreground shadow-glow"
              disabled={!file || loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Diagnosing…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Diagnose with FarmGPT</>
              )}
            </Button>

            {!file && !loading && (
              <p className="mt-3 text-xs text-muted-foreground">
                Please upload a clear photo of the affected crop to start a diagnosis.
              </p>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {(intro || blocks.length > 0) && (
              <div className="mt-5 space-y-4">
                {intro && <p className="text-sm text-muted-foreground">{intro}</p>}
                {blocks.map((b, i) => (
                  <BlockRenderer key={i} block={b} onFollowup={() => {}} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">
                Recent diagnoses {history.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">({history.length})</span>
                )}
              </h2>
              <Button size="sm" variant="ghost" onClick={() => void refreshHistory()}>
                Refresh
              </Button>
            </div>

            {historyLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your history…
              </div>
            ) : history.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                <Leaf className="mx-auto mb-2 h-5 w-5 opacity-60" />
                No diagnoses yet. Upload a crop photo to get started.
              </div>
            ) : (
              <ScrollArea className="mt-3 h-[420px] pr-2">
                <div className="space-y-2">
                  {history.map((r) => (
                    <div
                      key={r.id}
                      className="group flex items-center justify-between rounded-lg border border-border/60 bg-white/[0.02] p-3 transition-colors hover:border-accent/60 hover:bg-white/[0.04]"
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        {r.imageDataUrl ? (
                          <img
                            src={r.imageDataUrl}
                            alt={r.diseaseName}
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
                            <Leaf className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {r.diseaseName}
                            {typeof r.confidence === "number" && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                · {r.confidence}%
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatWhen(r.createdAt)}
                            {r.severity ? ` · ${r.severity}` : ""}
                          </div>
                        </div>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); void handleDelete(r.id); }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.diseaseName ?? "Diagnosis"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground">
                  {formatWhen(selected.createdAt)}
                </div>
                {selected.imageDataUrl && (
                  <img
                    src={selected.imageDataUrl}
                    alt={selected.diseaseName}
                    className="max-h-72 w-full rounded-lg object-contain"
                  />
                )}
                {selected.intro && (
                  <p className="text-sm text-muted-foreground">{selected.intro}</p>
                )}
                {(selected.blocks as unknown as Block[]).map((b, i) => (
                  <BlockRenderer key={i} block={b} onFollowup={() => {}} />
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
