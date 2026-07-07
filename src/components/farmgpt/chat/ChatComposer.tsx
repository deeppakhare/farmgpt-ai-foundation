import { useEffect, useRef, useState } from "react";
import { ImagePlus, Mic, MapPin, ArrowUp, FileText, X, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";


const MAX = 2000;
const DEFAULT_PLACEHOLDER =
  "Ask anything about crops, diseases, irrigation, weather, fertilizers, government schemes or upload a crop image…";

export type Attachment = { id: string; name: string; kind: "image" | "pdf"; url?: string };

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  autoFocus = true,
  placeholder = DEFAULT_PLACEHOLDER,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string, atts: Attachment[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [atts, setAtts] = useState<Attachment[]>([]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [value]);

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  const canSend = (value.trim().length > 0 || atts.length > 0) && !isStreaming;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim(), atts);
    setAtts([]);
  };

  const addFiles = (files: FileList | null, kind: "image" | "pdf") => {
    if (!files) return;
    const next: Attachment[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      kind,
      url: kind === "image" ? URL.createObjectURL(f) : undefined,
    }));
    setAtts((prev) => [...prev, ...next]);
  };

  return (
    <div className="glass rounded-3xl p-2.5 shadow-card focus-within:ring-2 focus-within:ring-ring">
      {atts.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2 pt-1.5 pb-1">
          {atts.map((a) => (
            <div
              key={a.id}
              className="group relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pr-2 pl-1.5 text-xs"
            >
              {a.kind === "image" && a.url ? (
                <img src={a.url} alt={a.name} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/15 text-rose-300">
                  <FileText className="h-4 w-4" />
                </div>
              )}
              <span className="max-w-[140px] truncate">{a.name}</span>
              <button
                onClick={() => setAtts((p) => p.filter((x) => x.id !== a.id))}
                className="rounded p-0.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        rows={1}
        className="block max-h-[220px] w-full resize-none bg-transparent px-3 pt-2 pb-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex flex-wrap items-center gap-1">
          <ToolBtn onClick={() => imgRef.current?.click()} icon={ImagePlus} label="Image" />
          <ToolBtn onClick={() => pdfRef.current?.click()} icon={FileText} label="PDF" />
          <ToolBtn icon={Mic} label="Voice" />
          <ToolBtn icon={MapPin} label="Location" />
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files, "image");
              e.target.value = "";
            }}
          />
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files, "pdf");
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "hidden text-[11px] tabular-nums text-muted-foreground sm:inline",
              value.length > MAX * 0.9 && "text-amber-300",
            )}
          >
            {value.length}/{MAX}
          </span>
          {isStreaming ? (
            <Button
              size="icon"
              onClick={onStop}
              className="h-9 w-9 rounded-full bg-white/10 text-foreground hover:bg-white/15"
              aria-label="Stop"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={submit}
              disabled={!canSend}
              className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-40"
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={onClick}
      className="h-8 gap-1.5 rounded-full text-muted-foreground hover:bg-white/5 hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
