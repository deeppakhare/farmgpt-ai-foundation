import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmer } from "@/hooks/useFarmer";

export const Route = createFileRoute("/_workspace/farm-profile")({
  component: FarmProfile,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

type ProfileState = {
  farmerName: string;
  village: string;
  district: string;
  state: string;
  farmSize: string;
  primaryCrop: string;
  soil: string;
  water: string;
  language: string;
};

const REQUIRED: { key: keyof ProfileState; label: string }[] = [
  { key: "farmerName", label: "Farmer Name" },
  { key: "village", label: "Farm Location" },
  { key: "farmSize", label: "Farm Size" },
  { key: "primaryCrop", label: "Current Crops" },
  { key: "soil", label: "Soil Type" },
  { key: "water", label: "Water Source" },
  { key: "language", label: "Preferred Language" },
];

function FarmProfile() {
  const { name, initials } = useFarmer();
  const [p, setP] = useState<ProfileState>({
    farmerName: "",
    village: "Hosakote",
    district: "Bengaluru Rural",
    state: "Karnataka",
    farmSize: "4.5",
    primaryCrop: "Tomato",
    soil: "loamy",
    water: "borewell",
    language: "en",
  });

  const set = <K extends keyof ProfileState>(k: K, v: ProfileState[K]) => setP((s) => ({ ...s, [k]: v }));

  const completion = useMemo(() => {
    const filled = REQUIRED.filter((f) => String(p[f.key] ?? "").trim().length > 0).length;
    return Math.round((filled / REQUIRED.length) * 100);
  }, [p]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Farm Onboarding</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The more we know about your farm, the sharper FarmGPT's advice becomes.
        </p>
      </header>

      {/* Completion */}
      <Card className="glass mb-4 border-0">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Profile completion</div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {completion}% <span className="text-sm font-normal text-muted-foreground">complete</span>
              </div>
            </div>
            <Badge className={cn(
              "rounded-full",
              completion === 100 ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300",
            )}>
              {completion === 100 ? "All set" : `${REQUIRED.length - Math.round(completion / 100 * REQUIRED.length)} left`}
            </Badge>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {REQUIRED.map((f) => {
              const done = String(p[f.key] ?? "").trim().length > 0;
              return (
                <li key={f.key} className="flex items-center gap-2 text-xs">
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={cn(done ? "text-foreground" : "text-muted-foreground")}>{f.label}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-primary/30">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-accent text-accent-foreground shadow-glow">
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div>
              <div className="font-display text-lg font-semibold capitalize">{p.farmerName || name}</div>
              <div className="text-sm text-muted-foreground">{p.village}, {p.state}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Field label="Farmer Name">
              <Input value={p.farmerName} placeholder="Your name" onChange={(e) => set("farmerName", e.target.value)} />
            </Field>
            <Field label="Village / Farm Location">
              <Input value={p.village} onChange={(e) => set("village", e.target.value)} />
            </Field>
            <Field label="District">
              <Input value={p.district} onChange={(e) => set("district", e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={p.state} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="Farm Size (acres)">
              <Input type="number" value={p.farmSize} onChange={(e) => set("farmSize", e.target.value)} />
            </Field>
            <Field label="Current Crops">
              <Input value={p.primaryCrop} onChange={(e) => set("primaryCrop", e.target.value)} />
            </Field>
            <Field label="Soil Type">
              <Select value={p.soil} onValueChange={(v) => set("soil", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="loamy">Loamy</SelectItem>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="sandy">Sandy</SelectItem>
                  <SelectItem value="black">Black cotton</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Water Source">
              <Select value={p.water} onValueChange={(v) => set("water", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="borewell">Borewell</SelectItem>
                  <SelectItem value="canal">Canal</SelectItem>
                  <SelectItem value="rain">Rain-fed</SelectItem>
                  <SelectItem value="river">River</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preferred Language">
              <Select value={p.language} onValueChange={(v) => set("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
                  <SelectItem value="mr">मराठी</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="mt-8 flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow">Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
