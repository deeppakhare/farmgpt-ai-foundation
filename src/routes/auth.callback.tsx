import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/farmgpt/AuthShell";
import { clearAuthRedirectParams, completeAuthRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth/callback")({ component: AuthCallback });

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Securing your FarmGPT session…");

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      const result = await completeAuthRedirect();
      if (!active) return;

      clearAuthRedirectParams("/auth/callback");

      if (result.ok) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      setMessage(result.message);
      window.setTimeout(() => {
        if (active) navigate({ to: "/login", replace: true });
      }, 1800);
    }

    finishSignIn();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <AuthShell title="Finishing sign-in" subtitle={message}>
      <div className="flex justify-center py-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </AuthShell>
  );
}