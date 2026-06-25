# Coding Conventions

## Style

| Rule                | Pattern                                              |
| ------------------- | ---------------------------------------------------- |
| Indentation         | 2 spaces, no tabs                                    |
| Quotes              | Single quotes. Double only when string contains `'`. |
| Semicolons          | Always                                               |
| Variables/functions | camelCase (`getUserData`)                            |
| Components          | PascalCase (`UserProfile`)                           |
| Constants           | UPPER_SNAKE_CASE (`API_URL`)                         |
| Functional          | Prefer `map`/`filter`/`reduce`. No mutation.         |

## Architecture: Layered Request Flow

```
app/api/**          →  route handler (thin: parse, auth, call service, respond)
lib/services/**     →  business logic (NO Next.js imports)
lib/db.ts           →  Prisma singleton (only services import this)
lib/validators/     →  Zod schemas (shared by routes + services)
lib/api/            →  response.ts (ok, created, noContent) + error.ts (ApiError, handleApiError)
```

Route handlers must NOT import `lib/db.ts` directly. Services must NOT import from `next/*`.

## Server Components vs Client Components

| Aspect        | Server Component                   | Client Component                                |
| ------------- | ------------------------------------ | ------------------------------------------------ |
| Directive     | None (default)                      | `"use client"` at top                            |
| Data fetching | Direct service calls                | `lib/queries/<resource>.ts` hooks (React Query)  |
| Mutations     | Not allowed                         | `useMutation` hooks from `lib/queries/**`        |
| Usage         | Page shells, layouts, data loaders  | Forms, tables, interactive UI                    |
| State         | No useState/useEffect               | Full React hooks                                 |

**Pattern:** Server component fetches data via the service layer → passes it as `initialData` into a client component's React Query hook. The hook owns refetch/cache/mutation from there.

```tsx
// Server component (page.tsx)
export default async function CommentsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  const session = await auth()
  const comments = await getCommentsBySite(siteId, { page: 1, limit: 50 })
  return <CommentsTable siteId={siteId} initialComments={comments.items} />
}

// Client component (comments-table.tsx)
"use client"
export function CommentsTable({ siteId, initialComments }: Props) {
  const { data: comments } = useComments(siteId, initialComments)
  const updateStatus = useUpdateCommentStatus(siteId)
  // interactive UI, mutations via React Query
}
```

## Client Data Fetching (React Query)

All client-side reads and writes go through `@tanstack/react-query`, never raw `fetch()` in a component.

```
lib/api-client.ts    →  apiFetch<T>(path, init) — typed wrapper, throws ApiClientError({ message, status, details })
lib/queries/**       →  one file per resource (sites.ts, comments.ts, users.ts, team.ts, pages.ts)
                         exports a query-key factory + useXQuery / useXMutation hooks
```

- Components call hooks from `lib/queries/<resource>.ts`. They never call `apiFetch` or `fetch` directly.
- `QueryClientProvider` is mounted once in `app/dashboard/layout.tsx` (dashboard-only — public/widget pages don't need it).
- Errors surface via a **global default**: the `QueryClient`'s `queryCache`/`mutationCache` `onError` shows a sonner toast automatically. Pass `meta: { silent: true }` on a query/mutation only when the call site needs custom error UX instead.
- Initial render uses `initialData` from the server-fetched props (no `dehydrate`/`HydrationBoundary` — one query per page, not nested trees).

```ts
// lib/queries/sites.ts
export const siteKeys = { detail: (id: string) => ["sites", id] as const }

export function useSite(id: string, initialData?: Site) {
  return useQuery({
    queryKey: siteKeys.detail(id),
    queryFn: () => apiFetch<Site>(`/api/v1/sites/${id}`),
    initialData,
  })
}

export function useUpdateSite(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Site>) =>
      apiFetch<Site>(`/api/v1/sites/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onMutate: async (body) => {
      const previous = qc.getQueryData<Site>(siteKeys.detail(id))
      qc.setQueryData(siteKeys.detail(id), (old: Site) => ({ ...old, ...body }))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(siteKeys.detail(id), ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: siteKeys.detail(id) }),
  })
}
```

List-shaped optimistic updates (comments table, users table) follow the same `onMutate`/`onError` snapshot-and-rollback shape over the list's query key.

## Forms

No react-hook-form. No form library. Native HTML forms + a `lib/queries/**` mutation hook:

```tsx
"use client"
export function GeneralSection({ site }: Props) {
  const updateSite = useUpdateSite(site.id)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    updateSite.mutate({ name: form.get('name') as string })
  }
  return <form onSubmit={handleSubmit}>...</form>
}
```

## Optimistic Updates

Use `useMutation`'s `onMutate`/`onError`/`onSettled` against the React Query cache — do not use `hooks/use-optimistic-state.ts` (removed) or React's built-in `useOptimistic`. See "Client Data Fetching (React Query)" above for the full pattern.

## URL-as-State

Search/filter/pagination uses URL params. Client pushes URLs, server reads `searchParams`:

```tsx
// Client: search input pushes URL
router.push(`?search=${query}`)

// Server: page reads searchParams
export default async function Page({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search } = await searchParams
}
```

## Error Handling

| Layer             | Pattern                                                  |
| ----------------- | -------------------------------------------------------- |
| Route handlers    | `try { ... } catch (err) { return handleApiError(err) }` |
| Services          | `throw new ApiError("message", statusCode)`              |
| Client fetcher     | `lib/api-client.ts` throws `ApiClientError(message, status, details)` |
| Client queries/mutations | `QueryClient`'s default `onError` → `toast.error()` via sonner. Override per-call only when UX needs to differ |
| Error boundaries  | `error.tsx` files at route levels                        |

**ApiError codes used:** 400 (bad input), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 429 (rate limit).

## Cache Revalidation

Routes that mutate data call `revalidatePath("/dashboard", "layout")` after writes.

## Permissions (RBAC)

Single source of truth in `lib/permissions/`:

| File                          | Purpose                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `lib/permissions/site.ts`     | `SiteRole`, `SiteCapability`, `siteCan()`, `SETTINGS_SECTION_CAPABILITY`, `GrantableSiteRole` |
| `lib/permissions/platform.ts` | `PlatformRole`, `PlatformCapability`, `platformCan()`, `PLATFORM_ROUTE_CAPABILITY`            |
| `lib/permissions/index.ts`    | Barrel re-export                                                                              |

**Site roles:** `SITE_OWNER` > `SITE_ADMIN` > `SITE_MODERATOR`

**Site capabilities:** `MODERATE`, `MANAGE_SETTINGS`, `MANAGE_EMAIL_SETTINGS`, `MANAGE_MODERATORS`, `MANAGE_ADMINS`, `DELETE_SITE`, `TRANSFER_SITE`

**Platform capabilities:** `VIEW_NOTICE_BOARD`, `VIEW_ADMINISTRATION`, `MANAGE_PLATFORM_SETTINGS` (only `PLATFORM_OWNER` has any)

**Import from:** `@/lib/permissions` (barrel), never deep paths.

## Key Conventions

| Concept       | Rule                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DRY           | If logic used in 2+ places → extract to `lib/` or `lib/utils.ts`                                                                                                                                             |
| Config        | Feature flags in `config/config.json`. Not `.env`.                                                                                                                                                           |
| Code Comments | Always write clear and concise comments but not bloated to explain the purpose of complex code blocks, functions, or components and Clear variable and function names can often reduce the need for comments |
| Parallelism   | Use `Promise.all` for independent queries in services                                                                                                                                                        |
| Transactions  | Array form for independent batch writes, callback form for dependent sequential writes                                                                                                                       |
