import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Lock, Palette, Globe, User, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_workspace/settings")({
  component: Settings,
});

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
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account, preferences and privacy.</p>
      </header>

      <div className="space-y-5">
        <Section icon={Palette} title="Appearance" desc="Theme and display preferences">
          <Row label="Theme" hint="Dark mode is recommended">
            <Select defaultValue="dark">
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
            <Select defaultValue="en">
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
          <Row label="Weather alerts" hint="Rain, storm, and frost warnings"><Switch defaultChecked /></Row>
          <Row label="Disease outbreak alerts"><Switch defaultChecked /></Row>
          <Row label="Weekly farm report"><Switch /></Row>
          <Row label="Market price updates"><Switch defaultChecked /></Row>
        </Section>

        <Section icon={ShieldCheck} title="Privacy" desc="Control your data">
          <Row label="Share anonymised farm data" hint="Helps improve FarmGPT for everyone"><Switch defaultChecked /></Row>
          <Row label="Personalised suggestions"><Switch defaultChecked /></Row>
        </Section>

        <Section icon={User} title="Account" desc="Profile and login details">
          <Row label="Email"><Input defaultValue="ravi@farm.io" className="w-64" /></Row>
          <Row label="Phone"><Input defaultValue="+91 98765 43210" className="w-64" /></Row>
        </Section>

        <Section icon={Lock} title="Security" desc="Password and two-factor authentication">
          <Row label="Change password"><Button variant="outline" size="sm">Update</Button></Row>
          <Row label="Two-factor authentication" hint="Add an extra layer of security"><Switch /></Row>
          <Row label="Delete account" hint="This action is permanent"><Button variant="destructive" size="sm">Delete</Button></Row>
        </Section>
      </div>
    </div>
  );
}
