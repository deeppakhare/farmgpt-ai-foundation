import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Lock, Palette, Globe, User, ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account/account.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_workspace/settings")({
  component: Settings,
});

type SettingsState = {
  theme: string;
  language: string;
  notify_weather: boolean;
  notify_disease: boolean;
  notify_weekly_report: boolean;
  notify_market: boolean;
  share_anon_data: boolean;
  personalised: boolean;
};

const DEFAULTS: SettingsState = {
  theme: "dark",
  language: "en",
  notify_weather: true,
  notify_disease: true,
  notify_weekly_report: false,
  notify_market: true,
  share_anon_data: true,
  personalised: true,
};

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw(""); setConfirm(""); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Update</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Change password</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">New password</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Confirm password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const deleteFn = useServerFn(deleteMyAccount);

  async function submit() {
    if (confirmText !== "DELETE") return toast.error('Type DELETE to confirm');
    setBusy(true);
    try {
      await deleteFn({});
      await supabase.auth.signOut();
      toast.success("Account deleted");
      navigate({ to: "/login", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="destructive" size="sm">Delete</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently removes your profile, farm data, chats, reports, and photos. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label className="text-xs">Type <span className="font-mono font-semibold">DELETE</span> to confirm</Label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={busy || confirmText !== "DELETE"}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon: Icon, title, desc, children }: any) {
  return (
    <Card className="glass border-0">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-accent/15 p-2 text-accent"><Icon className="h-4 w-4" /></div>
          <div>
            <h2 className="font-display text-base font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <Separator className="mb-4" />
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ label, hint, children }: any) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <Label className="text-sm">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Settings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [s, setS] = useState<SettingsState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingAcct, setSavingAcct] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("email, phone, preferred_language").eq("id", user.id).maybeSingle(),
        supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      const em = profile?.email || user.email || "";
      const ph = profile?.phone || "";
      setEmail(em); setOriginalEmail(em);
      setPhone(ph); setOriginalPhone(ph);

      if (settings) {
        setS({
          theme: settings.theme,
          language: settings.language,
          notify_weather: settings.notify_weather,
          notify_disease: settings.notify_disease,
          notify_weekly_report: settings.notify_weekly_report,
          notify_market: settings.notify_market,
          share_anon_data: settings.share_anon_data,
          personalised: settings.personalised,
        });
      } else if (profile?.preferred_language) {
        setS((prev) => ({ ...prev, language: profile.preferred_language }));
      }
      setLoading(false);
    })();
  }, []);

  // Auto-persist toggles/selects (debounced by setState update)
  async function updateSettings(patch: Partial<SettingsState>) {
    if (!userId) return;
    const next = { ...s, ...patch };
    setS(next);
    const { error } = await supabase.from("user_settings").upsert(
      { user_id: userId, ...next },
      { onConflict: "user_id" },
    );
    if (error) return toast.error(error.message);
    if (patch.language) {
      await supabase.from("profiles").update({ preferred_language: patch.language }).eq("id", userId);
    }
  }

  async function saveAccount() {
    if (!userId) return;
    setSavingAcct(true);
    try {
      const { error } = await supabase.from("profiles").update({
        email: email || null,
        phone: phone || null,
      }).eq("id", userId);
      if (error) throw error;

      if (email && email !== originalEmail) {
        const { error: eErr } = await supabase.auth.updateUser({ email });
        if (eErr) throw eErr;
        toast.info("Check your inbox to confirm the new email.");
      }
      setOriginalEmail(email);
      setOriginalPhone(phone);
      toast.success("Account details updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingAcct(false);
    }
  }

  const acctDirty = email !== originalEmail || phone !== originalPhone;

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account, preferences and privacy.</p>
      </header>

      <div className="space-y-5">
        <Section icon={Palette} title="Appearance" desc="Theme and display preferences">
          <Row label="Theme" hint="Dark mode is recommended">
            <Select value={s.theme} onValueChange={(v) => updateSettings({ theme: v })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </Section>

        <Section icon={Globe} title="Language" desc="Interface and assistant language">
          <Row label="Language">
            <Select value={s.language} onValueChange={(v) => updateSettings({ language: v })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
                <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                <SelectItem value="ta">தமிழ்</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </Section>

        <Section icon={Bell} title="Notifications" desc="Control what you get notified about">
          <Row label="Weather alerts" hint="Rain, storm, and frost warnings">
            <Switch checked={s.notify_weather} onCheckedChange={(v) => updateSettings({ notify_weather: v })} />
          </Row>
          <Row label="Disease outbreak alerts">
            <Switch checked={s.notify_disease} onCheckedChange={(v) => updateSettings({ notify_disease: v })} />
          </Row>
          <Row label="Weekly farm report">
            <Switch checked={s.notify_weekly_report} onCheckedChange={(v) => updateSettings({ notify_weekly_report: v })} />
          </Row>
          <Row label="Market price updates">
            <Switch checked={s.notify_market} onCheckedChange={(v) => updateSettings({ notify_market: v })} />
          </Row>
        </Section>

        <Section icon={ShieldCheck} title="Privacy" desc="Control your data">
          <Row label="Share anonymised farm data" hint="Helps improve FarmGPT for everyone">
            <Switch checked={s.share_anon_data} onCheckedChange={(v) => updateSettings({ share_anon_data: v })} />
          </Row>
          <Row label="Personalised suggestions">
            <Switch checked={s.personalised} onCheckedChange={(v) => updateSettings({ personalised: v })} />
          </Row>
        </Section>

        <Section icon={User} title="Account" desc="Profile and login details">
          <Row label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-64" />
          </Row>
          <Row label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" className="w-64" />
          </Row>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={!acctDirty || savingAcct}
              onClick={() => { setEmail(originalEmail); setPhone(originalPhone); }}>Cancel</Button>
            <Button size="sm" disabled={!acctDirty || savingAcct} onClick={saveAccount}>
              {savingAcct ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save"}
            </Button>
          </div>
        </Section>

        <Section icon={Lock} title="Security" desc="Password and account removal">
          <Row label="Change password"><ChangePasswordDialog /></Row>
          <Row label="Delete account" hint="This action is permanent"><DeleteAccountDialog /></Row>
        </Section>
      </div>
    </div>
  );
}
