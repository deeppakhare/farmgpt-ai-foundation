# Contributing to FarmGPT AI

First off — **thank you** for taking the time to contribute! 🌾
FarmGPT AI is built for farmers, and every improvement, bug fix, translation, or new agent makes the app more useful to the people who feed us.

This document explains how to propose changes, the coding conventions we follow, and how to get your PR merged quickly.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Project Conventions](#project-conventions)
- [Adding a New AI Agent](#adding-a-new-ai-agent)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Security Issues](#security-issues)

---

## Code of Conduct

This project and everyone participating in it is governed by the
[Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to
uphold it. Please report unacceptable behavior privately to the maintainers.

---

## Ways to Contribute

- 🐛 **Bug reports** — reproducible bugs with clear expected/actual behavior
- ✨ **Feature requests** — well-scoped user problems and proposed solutions
- 📖 **Docs** — typos, clarifications, translations of the README
- 🌐 **Translations** — help ship regional-language support
- 🧠 **New agents** — add a domain-specific agent (see below)
- 🎨 **UI/UX** — accessibility fixes, mobile polish, dark-mode tweaks
- 🧪 **Tests** — every new server function is welcome to ship with a test

---

## Development Setup

**Prerequisites:** Bun ≥ 1.1 (or Node ≥ 20), a Supabase project, and a Lovable AI Gateway key.

```bash
# 1. Fork on GitHub, then clone your fork
git clone https://github.com/<your-username>/farmgpt-ai.git
cd farmgpt-ai

# 2. Install dependencies
bun install

# 3. Copy env template and fill in your keys
cp .env.example .env

# 4. Start the dev server
bun run dev
```

The app runs at `http://localhost:8080`.

---

## Project Conventions

- **TypeScript strict mode** — no `any`, no `@ts-ignore` without a comment explaining why.
- **File-based routing** — routes live in `src/routes/` (never `src/pages/`).
- **Server RPC** — every backend call is a typed `createServerFn` in `src/lib/**/*.functions.ts`. Never call `fetch` from a component to your own backend.
- **Server-only helpers** end in `.server.ts` and are never bundled to the browser.
- **Auth** — every mutating server fn wears `.middleware([requireSupabaseAuth])`.
- **RLS + GRANT** — every new public table needs a migration with `CREATE TABLE → GRANT → ENABLE RLS → CREATE POLICY` in that order.
- **Roles** — never store roles on `profiles`. Use the `user_roles` table + `has_role()`.
- **Design tokens** — use semantic Tailwind tokens from `src/styles.css`. Never hardcode colors like `text-white` or `bg-[#fff]`.
- **Error handling** — log DB errors server-side, return generic messages to the client.
- **Zod-validated inputs** on every server function.
- **Prettier + ESLint** — run before opening a PR.

Type-check locally:

```bash
bunx tsgo
```

---

## Adding a New AI Agent

1. Add the agent name to `AgentName` in `src/lib/agents/types.ts`.
2. Add a system prompt to `SYSTEM_PROMPTS` in `src/lib/agents/run-agent.server.ts`.
3. Create a thin server fn wrapper at `src/lib/agents/<name>-agent.functions.ts` following the existing pattern.
4. Update `AGENTS` and the router prompt in `src/lib/agents/intent-router.functions.ts`.
5. Update the README's "AI Architecture" section.
6. Include example prompts + expected outputs in your PR.

---

## Commit Messages

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(chat): add streaming responses to disease agent
fix(auth): handle hash-only OAuth callback tokens
docs(readme): fix mermaid diagram typo
chore(deps): bump vite to 7.0.5
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

---

## Pull Request Process

1. **Branch** off `main`: `git checkout -b feat/my-feature`.
2. **Keep PRs focused** — one logical change per PR.
3. **Update docs** — README, inline comments, and this file if conventions change.
4. **Add screenshots** for any UI change.
5. **Verify** locally: type-check, run the app, test the affected flow.
6. **Fill out** the PR template completely.
7. **Link the issue** the PR closes (e.g. `Closes #123`).
8. A maintainer will review, request changes if needed, and merge.

We aim to review PRs within **5 business days**.

---

## Reporting Bugs

Please use the [Bug Report](./.github/ISSUE_TEMPLATE/bug_report.yml) issue
template and include:

- Steps to reproduce
- Expected vs actual behavior
- Browser + OS
- Screenshots or a short screen recording
- Console / network errors if available

---

## Requesting Features

Use the [Feature Request](./.github/ISSUE_TEMPLATE/feature_request.yml)
template. Explain the *user problem* first, the proposed solution second.

---

## Security Issues

**Do not open public issues for security vulnerabilities.**
See [SECURITY.md](./SECURITY.md) for our disclosure policy.

---

Thanks again for helping make FarmGPT AI better. 💚
