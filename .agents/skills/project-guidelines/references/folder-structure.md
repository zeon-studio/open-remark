# Folder Structure

```
open-remark/
├── app/
│   ├── (auth)/                    # Sign-in route group (no URL prefix)
│   │   └── sign-in/
│   ├── (dashboard)/               # Dashboard layout group
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard home
│   │   ├── settings/
│   │   ├── administration/
│   │   ├── notice-board/
│   │   ├── account/
│   │   └── sites/
│   │       ├── new/
│   │       └── [siteId]/
│   │           ├── page.tsx
│   │           ├── settings/
│   │           ├── comments/
│   │           ├── users/
│   │           ├── team/
│   │           └── install/
│   ├── api/
│   │   ├── v1/                    # Admin REST API (session-gated)
│   │   ├── widget/                # Public widget API (JWT-gated)
│   │   └── auth/[...nextauth]/    # Auth.js handler
│   ├── elements/                  # Design system showcase
│   └── changelog/
├── components/
│   ├── dashboard/                 # Dashboard-specific components
│   └── ui/                        # shadcn/ui primitives
├── lib/
│   ├── db.ts                      # Prisma singleton
│   ├── auth.ts                    # Full auth config (with Prisma)
│   ├── auth.config.ts             # Edge-safe auth (no Prisma)
│   ├── auth-widget.ts             # Widget JWT issue/verify
│   ├── services/                  # Business logic (server-side, no Next.js imports)
│   │   ├── comment-service.ts
│   │   ├── membership-service.ts  # requireSiteAccess() — all site-scoped auth checks
│   │   ├── moderation-service.ts
│   │   ├── page-service.ts
│   │   ├── site-service.ts
│   │   └── user-service.ts
│   ├── api-client.ts              # apiFetch<T>() — typed client fetch wrapper, throws ApiClientError
│   ├── queries/                   # Client-side React Query hooks, one file per resource
│   │   ├── sites.ts
│   │   ├── comments.ts
│   │   ├── users.ts
│   │   ├── team.ts
│   │   └── pages.ts
│   ├── validators/                # Zod schemas
│   ├── api/                       # response.ts + error.ts
│   ├── permissions/               # RBAC: site.ts, platform.ts, index.ts
│   ├── email/                     # email-service.ts, transport.ts, templates/
│   ├── cors.ts                    # isOriginAllowed, corsHeaders, getEffectiveOrigin
│   ├── rate-limit.ts              # In-memory LRU, 10 req/min default
│   ├── sanitize.ts
│   └── utils.ts
├── hooks/
│   └── use-mobile.ts
├── generated/prisma/              # Prisma client output (do not edit)
├── prisma/                        # Schema + migrations
├── widget/src/                    # Embed widget (vanilla TS)
├── config/config.json             # App configuration
├── proxy.ts                       # Next middleware (not middleware.ts)
└── public/                        # Static assets
```

## Key Path Aliases

| Alias | Points to |
|---|---|
| `@/` | Project root |
| `@/lib/*` | Shared utilities |
| `@/components/*` | UI components |
| `@/generated/prisma` | Prisma client |
