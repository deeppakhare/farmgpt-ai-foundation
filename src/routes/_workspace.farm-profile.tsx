import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  email: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  farmSize: string;
  primaryCrop: string;
  soil: string;
  water: string;
  language: string;
  avatarUrl: string;
};

const EMPTY: ProfileState = {
  farmerName: "",
  email: "",
  phone: "",
  village: "",
  district: "",
  state: "",
  farmSize: "",
  primaryCrop: "",
  soil: "loamy",
  water: "borewell",
  language: "en",
  avatarUrl: "",
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

function initialsOf(name: string, email: string) {
  const src = (name || email || "FA").trim();
  return src.slice(0, 2).toUpperCase();
}

function FarmProfile() {
  const [p, setP] = useState<ProfileState>(EMPTY);
  const [original, setOriginal] = useState<ProfileState>(EMPTY);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProfileState>(k: K, v: ProfileState[K]) =>
    setP((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const [{ data: profile }, { data: farm }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("farms").select("*").eq("user_id", user.id).order("created_at").limit(1).maybeSingle(),
      ]);

      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      const loaded: ProfileState = {
        farmerName: profile?.full_name || meta.full_name || meta.name || "",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
        village: farm?.village || "",
        district: farm?.district || "",
        state: farm?.state || "",
        farmSize: farm?.farm_size_acres != null ? String(farm.farm_size_acres) : "",
        primaryCrop: farm?.primary_crop || "",
        soil: farm?.soil_type || "loamy",
        water: farm?.water_source || "borewell",
        language: profile?.preferred_language || "en",
        avatarUrl: profile?.avatar_url || meta.avatar_url || "",
      };
      setP(loaded);
      setOriginal(loaded);
      setLoading(false);
    })();
  }, []);

  const completion = useMemo(() => {
    const filled = REQUIRED.filter((f) => String(p[f.key] ?? "").trim().length > 0).length;
    return Math.round((filled / REQUIRED.length) * 100);
  }, [p]);

  const dirty = useMemo(() => JSON.stringify(p) !== JSON.stringify(original), [p, original]);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl || "";
      set("avatarUrl", url);
      // persist immediately
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      setOriginal((o) => ({ ...o, avatarUrl: url }));
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!userId) {
      toast.error("Please sign in first");
      return;
    }
    setSaving(true);
    try {
      const profilePayload = {
        id: userId,
        full_name: p.farmerName || null,
        email: p.email || null,
        phone: p.phone || null,
        preferred_language: p.language || "en",
        avatar_url: p.avatarUrl || null,
      };
      const { error: pErr } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
      if (pErr) throw pErr;

      const { data: existingFarm } = await supabase
        .from("farms").select("id").eq("user_id", userId).order("created_at").limit(1).maybeSingle();

      const farmPayload = {
        user_id: userId,
        name: "My Farm",
        village: p.village || null,
        district: p.district || null,
        state: p.state || null,
        farm_size_acres: p.farmSize ? Number(p.farmSize) : null,
        primary_crop: p.primaryCrop || null,
        soil_type: p.soil || null,
        water_source: p.water || null,
      };

      const { error: fErr } = existingFarm
        ? await supabase.from("farms").update(farmPayload).eq("id", existingFarm.id)
        : await supabase.from("farms").insert(farmPayload);
      if (fErr) throw fErr;

      setOriginal(p);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setP(original);
    toast.message("Changes discarded");
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = initialsOf(p.farmerName, p.email);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Farm Onboarding</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The more we know about your farm, the sharper FarmGPT's advice becomes.
        </p>
      </header>

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
                  {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
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
                {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt={p.farmerName || "Avatar"} />}
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              <Button
                size="icon"
                className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-accent text-accent-foreground shadow-glow"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div>
              <div className="font-display text-lg font-semibold capitalize">{p.farmerName || "Your name"}</div>
              <div className="text-sm text-muted-foreground">
                {[p.village, p.state].filter(Boolean).join(", ") || p.email}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Field label="Farmer Name">
              <Input value={p.farmerName} placeholder="Your name" onChange={(e) => set("farmerName", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={p.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={p.phone} placeholder="+91 …" onChange={(e) => set("phone", e.target.value)} />
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
            <Button variant="outline" onClick={handleCancel} disabled={!dirty || saving}>Cancel</Button>
            <Button
              className="bg-gradient-primary text-primary-foreground shadow-glow"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
