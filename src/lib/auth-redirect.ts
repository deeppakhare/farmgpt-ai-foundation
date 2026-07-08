import { supabase } from "@/integrations/supabase/client";

type AuthRedirectResult =
  | { ok: true }
  | { ok: false; message: string };

function readAuthParam(name: string) {
  if (typeof window === "undefined") return null;

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  return searchParams.get(name) ?? hashParams.get(name);
}

export function getAuthCallbackUrl() {
  return `${window.location.origin}/auth/callback`;
}

export function hasAuthRedirectParams() {
  return Boolean(
    readAuthParam("code") ||
      readAuthParam("access_token") ||
      readAuthParam("refresh_token") ||
      readAuthParam("error") ||
      readAuthParam("error_description"),
  );
}

export function clearAuthRedirectParams(path = window.location.pathname) {
  window.history.replaceState(null, document.title, path);
}

export async function completeAuthRedirect(): Promise<AuthRedirectResult> {
  const providerError = readAuthParam("error_description") ?? readAuthParam("error");
  if (providerError) return { ok: false, message: providerError };

  const code = readAuthParam("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  const accessToken = readAuthParam("access_token");
  const refreshToken = readAuthParam("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  const { data } = await supabase.auth.getSession();
  if (data.session) return { ok: true };

  return { ok: false, message: "Sign-in did not return a session. Please try again." };
}