import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Mic, MapPin, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PLACEHOLDER =
  "Ask anything about your crops, weather, irrigation, fertilizers, diseases, government schemes or upload a crop image…";

export function PromptBox({
  value,
  onChange,
  onSend,
  className,
  placeholder = DEFAULT_PLACEHOLDER,
  autoFocus = false,
}: {
  value?: string;
  onChange?: (v: string) => void;
  onSend?: (text: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [inner, setInner] = useState("");
  const v = value ?? inner;
  const set = onChange ?? setInner;

  const submit = () => {
    const text = v.trim();
    if (!text) return;
    onSend?.(text);
  };

  return (
    <div className={cn("glass rounded-2xl p-2.5 shadow-card focus-within:ring-2 focus-within:ring-ring", className)}>
      <textarea
        autoFocus={autoFocus}
        value={v}
        onChange={(e) => set(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        rows={2}
        className="block w-full resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full text-muted-foreground hover:text-foreground">
            <ImagePlus className="h-4 w-4" /> <span className="hidden sm:inline">Upload</span>
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full text-muted-foreground hover:text-foreground">
            <Mic className="h-4 w-4" /> <span className="hidden sm:inline">Voice</span>
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full text-muted-foreground hover:text-foreground">
            <MapPin className="h-4 w-4" /> <span className="hidden sm:inline">Location</span>
          </Button>
        </div>
        <Button
          size="icon"
          type="button"
          onClick={submit}
          disabled={!v.trim()}
          className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-50"
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
