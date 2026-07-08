# Security Policy

The FarmGPT AI team and community take security seriously. We appreciate
responsible disclosure and will credit reporters (with permission) in the
release notes for the fix.

## Supported Versions

We provide security updates for the latest `main` branch and the most recent
tagged release.

| Version | Supported |
|---------|-----------|
| `main`  | ✅        |
| Latest tagged release | ✅ |
| Older releases | ❌ |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, email: **security@farmgpt.ai** (replace with your maintainer email)

Include as much of the following as you can:

- A clear description of the vulnerability
- Steps to reproduce (proof of concept if possible)
- The affected route, server function, or component
- The potential impact (data exposure, privilege escalation, DoS, etc.)
- Your name / handle for credit (optional)

You should receive an acknowledgement within **72 hours**. We aim to ship a fix
or a mitigation plan within **14 days** for high-severity issues.

## Scope

In scope:

- Authentication and session handling (`/auth/callback`, login, register)
- Server functions under `src/lib/**/*.functions.ts`
- Row-Level Security policies in `supabase/migrations/`
- Role escalation via `user_roles` / `has_role()`
- Prompt injection or data exfiltration via AI agents
- Secrets leakage into the client bundle

Out of scope:

- Vulnerabilities in third-party services (Supabase, Lovable, Cloudflare, Google) — please report those upstream
- Denial-of-service via unrealistic request volumes
- Missing security headers on assets served by the CDN (unless exploitable)
- Social engineering of maintainers

## Our Security Practices

- Every user-facing table has RLS enabled and policies scoped to `auth.uid()`.
- Roles live in a dedicated `user_roles` table, checked via a `SECURITY DEFINER` function.
- Every mutating server function uses `requireSupabaseAuth` middleware.
- DB errors are logged server-side; only generic messages reach the client.
- The service-role key is never bundled to the browser and only imported from `*.server.ts`.
- Inputs are validated with Zod.
- Dependencies are monitored via Dependabot (see [`.github/dependabot.yml`](./.github/dependabot.yml)).

Thank you for helping keep FarmGPT AI and its users safe. 🛡️
