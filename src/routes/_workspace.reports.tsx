import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Search, Activity, FileBarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_workspace/reports")({
  component: Reports,
});

const REPORTS = [
  { title: "Monthly Yield Report — October", size: "1.2 MB", date: "Nov 1, 2026" },
  { title: "Soil Health Analysis", size: "820 KB", date: "Oct 22, 2026" },
  { title: "Irrigation Efficiency Summary", size: "540 KB", date: "Oct 14, 2026" },
];

const ACTIVITY = [
  { t: "Diagnosis: Early Blight on Tomato", when: "Today, 09:24" },
  { t: "Weather alert acknowledged", when: "Yesterday" },
  { t: "Profile updated — Farm size", when: "3 days ago" },
];

function Reports() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Downloadable summaries generated from your farm activity.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search reports" className="pl-8" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="glass border-0">
          <CardContent className="p-5">
            <h2 className="font-display text-base font-semibold">Previous reports</h2>
            <div className="mt-4 space-y-2">
              {REPORTS.map((r) => (
                <div key={r.title} className="flex items-center gap-3 rounded-lg border border-border/60 bg-white/[0.02] p-3">
                  <div className="rounded-md bg-accent/15 p-2 text-accent"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.date} • {r.size}</div>
                  </div>
                  <Button size="sm" variant="ghost"><Download className="mr-1.5 h-4 w-4" />PDF</Button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
              <FileBarChart2 className="h-8 w-8 text-muted-foreground" />
              <div className="mt-2 text-sm font-medium">No more reports</div>
              <div className="text-xs text-muted-foreground">New reports will appear here weekly.</div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-5">
            <h2 className="font-display text-base font-semibold">Recent activity</h2>
            <div className="mt-3 space-y-3">
              {ACTIVITY.map((a) => (
                <div key={a.t} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-accent/15 p-1.5 text-accent"><Activity className="h-3.5 w-3.5" /></div>
                  <div>
                    <div className="text-sm">{a.t}</div>
                    <div className="text-xs text-muted-foreground">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
