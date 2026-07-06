import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera } from "lucide-react";

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

function FarmProfile() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Farm Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">This context helps FarmGPT give you more accurate advice.</p>
      </header>

      <Card className="glass border-0">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-primary/30">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">RK</AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-accent text-accent-foreground shadow-glow">
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div>
              <div className="font-display text-lg font-semibold">Ravi Kumar</div>
              <div className="text-sm text-muted-foreground">Karnataka, India</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Field label="Farmer Name"><Input defaultValue="Ravi Kumar" /></Field>
            <Field label="Village"><Input defaultValue="Hosakote" /></Field>
            <Field label="District"><Input defaultValue="Bengaluru Rural" /></Field>
            <Field label="State"><Input defaultValue="Karnataka" /></Field>
            <Field label="Farm Size (acres)"><Input type="number" defaultValue={4.5} /></Field>
            <Field label="Primary Crop"><Input defaultValue="Tomato" /></Field>
            <Field label="Secondary Crop"><Input defaultValue="Ragi" /></Field>
            <Field label="Soil Type">
              <Select defaultValue="loamy">
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
              <Select defaultValue="borewell">
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
              <Select defaultValue="en">
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
