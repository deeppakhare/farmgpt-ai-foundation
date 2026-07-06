import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/farmgpt/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({ component: Forgot });

function Forgot() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure link to reset your password"
      footer={<><Link to="/login" className="text-accent hover:underline">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="rounded-full bg-accent/15 p-3 text-accent"><CheckCircle2 className="h-6 w-6" /></div>
          <div className="mt-3 font-medium">Check your inbox</div>
          <p className="mt-1 text-sm text-muted-foreground">If that email exists, we've sent a reset link.</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required placeholder="you@farm.io" /></div>
          <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
