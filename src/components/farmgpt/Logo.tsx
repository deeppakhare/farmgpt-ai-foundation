import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true, size = "md" }: { className?: string; showText?: boolean; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative flex items-center justify-center rounded-xl bg-gradient-primary shadow-glow", sz)}>
        <Sprout className="h-1/2 w-1/2 text-primary-foreground" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={cn("font-display font-semibold tracking-tight", text)}>
          Farm<span className="text-gradient">GPT</span>
        </span>
      )}
    </div>
  );
}
