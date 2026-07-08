# Changelog

All notable changes to **FarmGPT AI** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Voice assistant (Hindi + regional languages)
- WhatsApp bot integration
- Live mandi price feed (data.gov.in)
- Offline-first PWA mode

---

## [1.0.0] — 2026-07-08

### Added
- Multi-agent AI system with 6 specialists (Disease, Weather, Market, Government, Fertilizer, General) + Intent Router
- Multimodal crop disease scanner with follow-up Q&A that preserves image context
- AI-powered Farm Planner producing structured JSON season plans
- Command Center weekly briefing
- Market Intelligence, Weather, and Reports workspaces
- Chat with per-conversation memory persisted in Supabase
- Email + Google OAuth authentication via Lovable Cloud Auth
- Dedicated `/auth/callback` route handling both PKCE code and legacy hash-token flows
- Row-Level Security on every public table
- `user_roles` table + `has_role()` `SECURITY DEFINER` function (no privilege escalation)
- Dark mode + fully responsive UI (shadcn/ui + Tailwind v4)
- Edge-deployed on Cloudflare Workers via TanStack Start

### Security
- Ownership verification in `appendMessage` (chat ownership checked before insert)
- Generic client-facing error messages; DB errors logged server-side only
- Service-role key isolated to `*.server.ts` modules

---

## [0.1.0] — 2026-06-15

### Added
- Initial project scaffolding on TanStack Start v1 + React 19
- Supabase integration with schema for `profiles`, `farms`, `chat_history`, `chat_messages`
- Base UI shell (sidebar, topbar, auth pages)

[Unreleased]: https://github.com/your-username/farmgpt-ai/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-username/farmgpt-ai/releases/tag/v1.0.0
[0.1.0]: https://github.com/your-username/farmgpt-ai/releases/tag/v0.1.0
