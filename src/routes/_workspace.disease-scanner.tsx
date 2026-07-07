import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { UploadCloud, Camera, ImageIcon, Sparkles, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { runDiseaseAgent } from "@/lib/agents/disease-agent.functions";
import { BlockRenderer } from "@/components/farmgpt/chat/RichCards";
import type { Block } from "@/lib/chat-mocks";

export const Route = createFileRoute("/_workspace/disease-scanner")({
  component: DiseaseScanner,
});

const RECENT = [
  { crop: "Tomato", result: "Early Blight", date: "Today, 09:24", severity: "Moderate" },
  { crop: "Wheat", result: "Rust", date: "Yesterday", severity: "Mild" },
  { crop: "Cotton", result: "Healthy", date: "2 days ago", severity: "—" },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DiseaseScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intro, setIntro] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const diseaseFn = useServerFn(runDiseaseAgent);

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
      setIntro(response.content ?? null);
      setBlocks((response.blocks ?? []) as unknown as Block[]);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [file, diseaseFn]);

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
            <label
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault(); setDrag(false);
                const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
              }}
              className={cn(
                "relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                drag ? "border-accent bg-accent/5" : "border-border hover:border-accent/60 hover:bg-white/[0.02]",
              )}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="max-h-72 rounded-lg object-contain" />
                  <Button variant="ghost" size="sm" className="mt-3" onClick={(e) => { e.preventDefault(); handleFile(null); }}>
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
                    <Button size="sm" variant="secondary"><ImageIcon className="mr-1.5 h-4 w-4" />Browse</Button>
                    <Button size="sm" variant="outline"><Camera className="mr-1.5 h-4 w-4" />Camera</Button>
                  </div>
                </>
              )}
              <input
                type="file" accept="image/*" className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>

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
              <h2 className="font-display text-base font-semibold">Recent diagnoses</h2>
              <Button size="sm" variant="ghost">View all</Button>
            </div>
            <div className="mt-3 space-y-2">
              {RECENT.map((r) => (
                <div key={r.crop + r.date} className="flex items-center justify-between rounded-lg border border-border/60 bg-white/[0.02] p-3">
                  <div>
                    <div className="text-sm font-medium">{r.crop} • {r.result}</div>
                    <div className="text-xs text-muted-foreground">{r.date}</div>
                  </div>
                  <div className="text-xs text-accent">{r.severity}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
