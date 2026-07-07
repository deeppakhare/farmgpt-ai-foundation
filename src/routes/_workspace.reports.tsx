import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  Download,
  Search,
  Activity,
  FileBarChart2,
  Trash2,
  Loader2,
  Sprout,
  LineChart,
  LayoutDashboard,
  CloudSun,
  Bug,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  listReports,
  listActivity,
  getReportPdf,
  deleteReport,
  type SavedReport,
  type ActivityRow,
  type ReportKind,
} from "@/lib/reports/reports.functions";

export const Route = createFileRoute("/_workspace/reports")({
  component: Reports,
});

const KIND_META: Record<
  ReportKind,
  { label: string; icon: typeof FileText; color: string }
> = {
  "farm-plan": { label: "Farm Plan", icon: Sprout, color: "text-emerald-500" },
  "market-intelligence": { label: "Market Intelligence", icon: LineChart, color: "text-sky-500" },
  "command-center": { label: "Command Center", icon: LayoutDashboard, color: "text-violet-500" },
  weather: { label: "Weather", icon: CloudSun, color: "text-cyan-500" },
  "disease-scan": { label: "Disease Scan", icon: Bug, color: "text-rose-500" },
  general: { label: "Report", icon: FileText, color: "text-accent" },
};

function fmtSize(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  return fmtDate(iso);
}

function base64ToBlob(b64: string, type = "application/pdf") {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

function Reports() {
  const runList = useServerFn(listReports);
  const runActivity = useServerFn(listActivity);
  const runGetPdf = useServerFn(getReportPdf);
  const runDelete = useServerFn(deleteReport);

  const [reports, setReports] = useState<SavedReport[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([runList(), runActivity()]);
      setReports(r);
      setActivity(a);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => {
      const meta = KIND_META[r.kind] ?? KIND_META.general;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.summary ?? "").toLowerCase().includes(q) ||
        meta.label.toLowerCase().includes(q)
      );
    });
  }, [reports, query]);

  const onDownload = async (r: SavedReport) => {
    setBusyId(r.id);
    try {
      const { title, pdfBase64 } = await runGetPdf({ data: { id: r.id } });
      const blob = base64ToBlob(pdfBase64);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^\w\-]+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (r: SavedReport) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    setBusyId(r.id);
    try {
      await runDelete({ data: { id: r.id } });
      setReports((prev) => prev.filter((x) => x.id !== r.id));
      toast.success("Report deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your saved reports from Farm Planner, Market Intelligence, Command Center and more.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="glass border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Previous reports</h2>
              <span className="text-xs text-muted-foreground">{reports.length} total</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading reports…
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
                <FileBarChart2 className="h-10 w-10 text-muted-foreground" />
                <div className="mt-3 text-sm font-medium">
                  {reports.length === 0 ? "No reports yet" : "No matching reports"}
                </div>
                <div className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {reports.length === 0
                    ? "Generate a Farm Plan, Market report or Command Brief — it will appear here for download."
                    : "Try a different search term."}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {filtered.map((r) => {
                  const meta = KIND_META[r.kind] ?? KIND_META.general;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-white/[0.02] p-3"
                    >
                      <div className={`rounded-md bg-accent/15 p-2 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {meta.label} • {fmtDate(r.created_at)} • {fmtSize(r.size_bytes)}
                        </div>
                        {r.summary && (
                          <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/80">
                            {r.summary}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === r.id}
                        onClick={() => onDownload(r)}
                      >
                        {busyId === r.id ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-1.5 h-4 w-4" />
                        )}
                        PDF
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={busyId === r.id}
                        onClick={() => onDelete(r)}
                        aria-label="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-5">
            <h2 className="font-display text-base font-semibold">Recent activity</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : activity.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No activity yet. Your actions across FarmGPT will show up here.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-accent/15 p-1.5 text-accent">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm">{a.title}</div>
                      {a.detail && (
                        <div className="line-clamp-1 text-xs text-muted-foreground/80">{a.detail}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
