import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sprout,
  Droplets,
  FlaskConical,
  Bug,
  ShieldAlert,
  Scissors,
  TrendingUp,
  IndianRupee,
  Wallet,
  Download,
  Loader2,
  Calendar,
  MapPin,
  Lightbulb,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  generateFarmPlan,
  type FarmPlan,
  type PlannerInput,
  type ScheduleItem,
} from "@/lib/farm-planner/planner.functions";

export const Route = createFileRoute("/_workspace/farm-planner")({
  component: FarmPlannerPage,
});

const SOIL_TYPES = ["Black (Regur)", "Red", "Alluvial", "Sandy", "Loamy", "Clay", "Laterite"];
const IRRIGATION_SOURCES = ["Well", "Borewell", "Canal", "Drip", "Sprinkler", "Rainfed", "River", "Pond"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function FarmPlannerPage() {
  const run = useServerFn(generateFarmPlan);
  const [form, setForm] = useState<PlannerInput>({
    crop: "Tomato",
    state: "Maharashtra",
    district: "",
    landSizeAcres: 1,
    soilType: "Black (Regur)",
    irrigationSource: "Drip",
    sowingDate: todayISO(),
  });
  const [plan, setPlan] = useState<FarmPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof PlannerInput>(k: K, v: PlannerInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onGenerate = async () => {
    if (!form.crop || !form.state || !form.district || !form.sowingDate) {
      toast.error("Please fill crop, state, district and sowing date.");
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const p = await run({ data: form });
      setPlan(p);
      toast.success("Farm plan ready!");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const onDownloadPdf = async () => {
    if (!plan) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;

    const line = (text: string, size = 10, bold = false, color: [number, number, number] = [30, 30, 30]) => {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const wrapped = doc.splitTextToSize(text, pageW - margin * 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * (size + 3);
    };
    const gap = (n = 8) => (y += n);
    const hr = () => {
      if (y > 780) { doc.addPage(); y = margin; }
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 10;
    };

    line("FarmGPT — Seasonal Farm Plan", 18, true, [20, 100, 60]);
    line(`${plan.crop}  •  ${plan.location}  •  ${plan.landSizeAcres} acres  •  ${plan.season}`, 10, false, [90, 90, 90]);
    gap();
    line(plan.summary, 10);
    hr();

    line("Crop Calendar", 14, true, [20, 80, 140]);
    plan.calendar.forEach((s) => {
      line(`• ${s.stage}  (${fmtDate(s.startDate)} → ${fmtDate(s.endDate)})`, 11, true);
      s.activities.forEach((a) => line(`   – ${a}`, 10));
    });
    hr();

    line("Irrigation Schedule", 14, true, [20, 80, 140]);
    plan.irrigation.forEach((i) =>
      line(`• ${fmtDate(i.date)} — ${i.stage} — ${i.method} — ${i.quantity}. ${i.notes}`, 10),
    );
    hr();

    const scheduleBlock = (title: string, items: ScheduleItem[]) => {
      line(title, 14, true, [20, 80, 140]);
      items.forEach((it) => {
        line(`• ${fmtDate(it.date)} — ${it.stage}${it.problem ? ` — ${it.problem}` : ""}`, 11, true);
        line(`  Purpose: ${it.purpose}`, 10);
        it.options.forEach((o, idx) => {
          line(`  Option ${idx + 1}: ${o.name}`, 10, true);
          line(`     Price: ${o.price}  |  For your land: ${o.quantityForLand}  |  Dose per 20L pump: ${o.dosePer20LPump}`, 9);
          if (o.notes) line(`     Note: ${o.notes}`, 9);
        });
      });
      hr();
    };
    scheduleBlock("Fertilizer Schedule", plan.fertilizer);
    scheduleBlock("Pest Monitoring", plan.pest);
    scheduleBlock("Disease Prevention", plan.disease);

    line("Harvest Timeline", 14, true, [20, 80, 140]);
    line(`Window: ${fmtDate(plan.harvest.fromDate)} → ${fmtDate(plan.harvest.toDate)}`, 10);
    line("Indicators:", 10, true);
    plan.harvest.indicators.forEach((x) => line(`  • ${x}`, 10));
    line("Post-harvest:", 10, true);
    plan.harvest.postHarvest.forEach((x) => line(`  • ${x}`, 10));
    hr();

    line("Cost Breakdown", 14, true, [20, 80, 140]);
    let total = 0;
    plan.costs.forEach((c) => {
      total += c.amount;
      line(`• ${c.category}: ${inr(c.amount)} — ${c.detail}`, 10);
    });
    line(`Total: ${inr(total)}`, 11, true);
    hr();

    line("Profit Estimate", 14, true, [20, 80, 140]);
    line(`Yield: ${plan.profit.yieldQuintalPerAcre} q/acre × ${plan.landSizeAcres} acres = ${plan.profit.totalYieldQuintal} q`, 10);
    line(`Market price: ${inr(plan.profit.marketPricePerQuintal)}/q`, 10);
    line(`Gross revenue: ${inr(plan.profit.grossRevenue)}`, 10);
    line(`Total cost: ${inr(plan.profit.totalCost)}`, 10);
    line(`Net profit: ${inr(plan.profit.netProfit)}  |  ROI: ${plan.profit.roiPercent}%`, 11, true, [20, 120, 60]);
    plan.profit.assumptions.forEach((a) => line(`  • ${a}`, 9, false, [110, 110, 110]));

    if (plan.tips.length) {
      hr();
      line("Tips", 14, true, [20, 80, 140]);
      plan.tips.forEach((t) => line(`• ${t}`, 10));
    }

    doc.save(`FarmPlan-${plan.crop}-${plan.location.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Farm Planner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Professional seasonal plan — calendar, inputs, costs and profit projection for your crop.
        </p>
      </header>

      {/* Form */}
      <Card className="glass mb-6 border-0">
        <CardContent className="p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Crop">
              <Input value={form.crop} onChange={(e) => update("crop", e.target.value)} placeholder="Tomato, Cotton, Wheat…" />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="Maharashtra" />
            </Field>
            <Field label="District">
              <Input value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Buldhana" />
            </Field>
            <Field label="Land Size (acres)">
              <Input
                type="number"
                min={0.1}
                step={0.1}
                value={form.landSizeAcres}
                onChange={(e) => update("landSizeAcres", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Soil Type">
              <Select value={form.soilType} onValueChange={(v) => update("soilType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOIL_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Irrigation Source">
              <Select value={form.irrigationSource} onValueChange={(v) => update("irrigationSource", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IRRIGATION_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sowing Date">
              <Input type="date" value={form.sowingDate} onChange={(e) => update("sowingDate", e.target.value)} />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={onGenerate}
              disabled={loading}
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sprout className="mr-2 h-4 w-4" />}
              {loading ? "Generating plan…" : "Generate Farm Plan"}
            </Button>
            {plan && (
              <Button variant="outline" onClick={onDownloadPdf}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="rounded-xl border border-border/60 bg-white/[0.02] p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-3 text-sm text-muted-foreground">Building your seasonal plan… this may take up to a minute.</p>
        </div>
      )}

      {plan && !loading && <PlanView plan={plan} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="rounded-md bg-accent/15 p-1.5 text-accent"><Icon className="h-4 w-4" /></div>
      <div>
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function TimelineDot() {
  return (
    <span className="absolute left-[-5px] top-2 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
  );
}

function PlanView({ plan }: { plan: FarmPlan }) {
  const totalCost = plan.costs.reduce((s, c) => s + c.amount, 0);
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="gap-1"><Sprout className="h-3 w-3" />{plan.crop}</Badge>
            <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{plan.location}</Badge>
            <Badge variant="secondary" className="gap-1"><Layers className="h-3 w-3" />{plan.landSizeAcres} acres</Badge>
            <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" />{plan.season}</Badge>
          </div>
          <p className="mt-3 text-sm">{plan.summary}</p>
        </CardContent>
      </Card>

      {/* Quick KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={TrendingUp} label="Estimated Yield" value={`${plan.profit.totalYieldQuintal} q`} sub={`${plan.profit.yieldQuintalPerAcre} q/acre`} />
        <Kpi icon={IndianRupee} label="Gross Revenue" value={inr(plan.profit.grossRevenue)} sub={`@ ${inr(plan.profit.marketPricePerQuintal)}/q`} />
        <Kpi icon={Wallet} label="Total Cost" value={inr(totalCost)} sub={`${plan.costs.length} categories`} />
        <Kpi icon={TrendingUp} label="Net Profit" value={inr(plan.profit.netProfit)} sub={`ROI ${plan.profit.roiPercent}%`} highlight />
      </div>

      {/* Crop Calendar */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <SectionHeader icon={Calendar} title="Crop Calendar" subtitle="Growth stages across the full season" />
          <ol className="relative ml-2 space-y-4 border-l border-border pl-5">
            {plan.calendar.map((s, i) => (
              <li key={i} className="relative">
                <TimelineDot />
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="text-sm font-semibold">{s.stage}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</div>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
                  {s.activities.map((a, j) => <li key={j}>{a}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Irrigation */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <SectionHeader icon={Droplets} title="Irrigation Schedule" subtitle="When and how much to water" />
          <ol className="relative ml-2 space-y-3 border-l border-border pl-5">
            {plan.irrigation.map((i, idx) => (
              <li key={idx} className="relative">
                <TimelineDot />
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="text-sm font-semibold">{fmtDate(i.date)}</div>
                  <Badge variant="outline" className="text-[10px]">{i.stage}</Badge>
                  <Badge variant="outline" className="text-[10px]">{i.method}</Badge>
                  <div className="text-xs text-muted-foreground">{i.quantity}</div>
                </div>
                {i.notes && <p className="mt-1 text-sm text-muted-foreground">{i.notes}</p>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <ScheduleCard icon={FlaskConical} title="Fertilizer Schedule" subtitle="2 product options, dose per 20L sprayer" items={plan.fertilizer} />
      <ScheduleCard icon={Bug} title="Pest Monitoring" subtitle="Pest problems + treatment options" items={plan.pest} />
      <ScheduleCard icon={ShieldAlert} title="Disease Prevention" subtitle="Prevent common diseases for your crop" items={plan.disease} />

      {/* Harvest */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <SectionHeader icon={Scissors} title="Harvest Timeline" subtitle={`${fmtDate(plan.harvest.fromDate)} → ${fmtDate(plan.harvest.toDate)}`} />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ready-to-harvest indicators</div>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {plan.harvest.indicators.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post-harvest handling</div>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {plan.harvest.postHarvest.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Costs */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <SectionHeader icon={Wallet} title="Cost Breakdown" subtitle={`Total for ${plan.landSizeAcres} acres`} />
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Detail</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {plan.costs.map((c, i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium">{c.category}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.detail}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{inr(c.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t border-border/60 bg-white/[0.03]">
                  <td className="px-3 py-2 font-semibold" colSpan={2}>Total Cost</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{inr(totalCost)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Profit */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <SectionHeader icon={TrendingUp} title="Estimated Profit" subtitle="Full-cycle calculation" />
          <div className="grid gap-2 text-sm">
            <Row label="Yield per acre" value={`${plan.profit.yieldQuintalPerAcre} quintal`} />
            <Row label={`Total yield (${plan.landSizeAcres} acres)`} value={`${plan.profit.totalYieldQuintal} quintal`} />
            <Row label="Market price" value={`${inr(plan.profit.marketPricePerQuintal)} / quintal`} />
            <Row label="Gross revenue" value={inr(plan.profit.grossRevenue)} />
            <Row label="Total cost" value={inr(plan.profit.totalCost)} />
            <div className="mt-2 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
              <div className="text-sm font-semibold">Net Profit</div>
              <div className="text-lg font-bold text-accent">{inr(plan.profit.netProfit)} <span className="text-xs font-medium text-muted-foreground">• ROI {plan.profit.roiPercent}%</span></div>
            </div>
          </div>
          {plan.profit.assumptions.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assumptions</div>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                {plan.profit.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      {plan.tips.length > 0 && (
        <Card className="glass border-0">
          <CardContent className="p-5">
            <SectionHeader icon={Lightbulb} title="Pro Tips" />
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {plan.tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, highlight }: {
  icon: React.ElementType; label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <Card className={"glass border-0 " + (highlight ? "ring-1 ring-accent/40" : "")}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="mt-1 font-display text-xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ScheduleCard({
  icon, title, subtitle, items,
}: {
  icon: React.ElementType; title: string; subtitle?: string; items: ScheduleItem[];
}) {
  return (
    <Card className="glass border-0">
      <CardContent className="p-5">
        <SectionHeader icon={icon} title={title} subtitle={subtitle} />
        <ol className="relative ml-2 space-y-5 border-l border-border pl-5">
          {items.map((it, idx) => (
            <li key={idx} className="relative">
              <TimelineDot />
              <div className="flex flex-wrap items-baseline gap-2">
                <div className="text-sm font-semibold">{fmtDate(it.date)}</div>
                <Badge variant="outline" className="text-[10px]">{it.stage}</Badge>
                {it.problem && <Badge variant="secondary" className="text-[10px]">{it.problem}</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{it.purpose}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {it.options.map((o, oi) => (
                  <div key={oi} className="rounded-lg border border-border/60 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">Option {oi + 1}: {o.name}</div>
                      <Badge className="bg-accent/15 text-accent hover:bg-accent/20">{o.price}</Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs">
                      <div><span className="text-muted-foreground">For your land: </span><span className="font-medium">{o.quantityForLand}</span></div>
                      <div><span className="text-muted-foreground">Dose per 20L pump: </span><span className="font-medium">{o.dosePer20LPump}</span></div>
                      {o.notes && <div className="text-muted-foreground">{o.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
