Guidance for agentic tools working in this repo.

> **Detailed conventions: `project-guidelines` skill** (`.agents/skills/project-guidelines/`).
> Invoke it before changing schema, routes, UI, services, folder structure, or auth — or writing a commit.
> This file is the always-loaded map; the skill is the rulebook. Don't duplicate its details here.

## Project

OpenRemark — self-hostable comment system for static sites. Next.js 16 (App Router) server + vanilla-TS shadow-DOM embed widget + PostgreSQL via Prisma.

Beta: APIs and schema may change without migration paths.

## Commands

Package manager: **pnpm** (v11).

```bash
pnpm dev              # prisma generate + widget build + next dev (turbopack)
pnpm build            # prisma generate + widget build + next build
pnpm start            # production next start
pnpm typecheck        # tsc --noEmit (run before declaring work done)
pnpm lint             # eslint
pnpm format           # prettier --write "**/*.{ts,tsx}"
pnpm format:check     # prettier --check

# Database (PostgreSQL, Prisma)
pnpm db:migrate       # prisma migrate dev — create + apply
pnpm db:generate      # regenerate Prisma client (output: generated/prisma)
pnpm db:seed          # tsx prisma/seed.ts — demo data
pnpm db:studio        # Prisma Studio GUI
pnpm db:status        # scripts/db-manager.ts status
pnpm db:reset         # DESTRUCTIVE — requires typed confirmation
pnpm db:benchmark:seed
pnpm db:benchmark:run

# Widget bundle
pnpm widget:build     # minified → public/embed.js (+ debug → public/embed.debug.js)
pnpm widget:dev       # non-minified, faster
```

No test runner. `pnpm dev` regenerates Prisma client and rebuilds widget every start — don't skip it.

## Architecture

Detailed rules per section: `project-guidelines` skill (reference file in parentheses).

### Two auth systems, kept separate (`auth-system.md`)

| System | Who      | Mechanism                                  | Storage              | Routes                    |
| ------ | -------- | ------------------------------------------ | -------------------- | ------------------------- |
| Admin  | Owners   | Auth.js v5 + Google OAuth → session cookie | Server session       | `/dashboard`, `/api/v1/*` |
| Widget | Visitors | Google OAuth PKCE → signed Widget JWT      | `localStorage` (JWT) | `/api/widget/*`           |

- Admin routes gated by `proxy.ts` (Next middleware — named `proxy.ts`, not `middleware.ts`; matcher: `/dashboard/:path*`). Uses edge-safe `lib/auth.config.ts` (no Prisma adapter).
- Widget: `Authorization: Bearer <jwt>` — no cookies (cross-origin). CSRF n/a; CORS allowlist enforced per `Site.allowedOrigins`.
- `WIDGET_JWT_SECRET` ≠ `AUTH_SECRET` — do not conflate.

### Layered request flow — HARD RULE (`coding-conventions.md`)

```
app/api/**          route handler  — thin: parse, auth, call service, respond (≤25 lines)
  ↓
lib/services/**     business logic — NO Next.js imports (must be framework-agnostic)
  ↓
lib/db.ts           Prisma singleton — ONLY services may import this
  ↓
PostgreSQL (Prisma adapter-pg)
```

- Route handlers never import `lib/db.ts` — they call services.
- Zod schemas: `lib/validators/`, shared by routes + services.
- Response/error helpers: `lib/api/`.

### Data model (`database-schema.md`)

```
User ──< Site ──< Page ──< Comment ──< Comment (replies, self-ref via @relation("Replies"))
                              │
                              └──< ModerationLog
```

- `Comment.status`: PENDING | APPROVED | SPAM | DELETED. Soft delete only — never physically delete domain rows.
- `Site.siteKey` — public embed identifier. `Site.allowedOrigins` — JSON (Postgres native), enforced on widget POST.

### Non-obvious gotchas (`folder-structure.md`)

- `proxy.ts` (root) — the Next middleware, renamed from `middleware.ts`.
- `generated/prisma/` — Prisma client output. Import from `@/generated/prisma/client`. Do not edit.
- `prisma.config.ts` — Prisma schema/migrations config.
- `config/config.json` — feature flags + app config. All new config goes here, not `.env` or hardcoded.

### Widget specifics

- Shadow DOM — CSS isolated. Visuals: `widget/src/styles.css`.
- Compile-time constants via esbuild `define`: `__APP_URL__`, `__GOOGLE_CLIENT_ID__`, `__STYLES__`. **Never** read `process.env` in widget source.
- `widget/build.ts` loads `.env` then `.env.local` — widget needs `NEXT_PUBLIC_APP_URL` + `GOOGLE_CLIENT_ID` at build time.
- Auth flow (PKCE): popup → `accounts.google.com` (with `code_challenge`) → redirect to `/api/widget/oauth-callback` → `postMessage({type: "ZEON_GOOGLE_CODE", code, state})` to opener → `POST /api/widget/auth` exchanges `code` + `code_verifier` → server verifies with Google → issues 7-day Widget JWT.

## Environment

Required env (see `.env.example`): `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `WIDGET_JWT_SECRET`, `NEXT_PUBLIC_APP_URL`.

Google Cloud Console — authorized redirect URIs must include:

- `<APP_URL>/api/auth/callback/google` (admin Auth.js)
- `<APP_URL>/api/widget/oauth-callback` (widget visitor flow)

<!-- BEGIN:project-guidelines-rules -->

# Read project guidelines before changing structure, schema, components, or routes

Before modifying or creating database schemas, coding patterns, UI components, folder structure, or routes, trigger the `project-guidelines` skill for the relevant reference so you follow project conventions (DB rules, coding style, component usage, auth patterns, route templates).

<!-- END:project-guidelines-rules -->
