# UI Components

**Stack:** shadcn/ui (radix-luma style) · Tailwind v4 · Remix icons · Do NOT import Radix primitives directly.

**Config:** `components.json` — style: radix-luma, baseColor: mauve, cssVariables: true, iconLibrary: remixicon

**Add new component:** `npx shadcn@latest add <component>`

## Design Tokens

**Always style with the existing tokens** in `styles/design-tokens.css`. They define `:root` + `.dark` and are exposed as Tailwind v4 utilities via `@theme inline` — so use the utility, never a raw value. This keeps dark mode, theming, and the radix-luma palette consistent for free.

| Token group | Tailwind utility                                                      | Use for                                 |
| ----------- | --------------------------------------------------------------------- | --------------------------------------- |
| Surface     | `bg-background`, `bg-card`, `bg-popover`, `bg-sidebar`                | Page, card, dropdown, sidebar surfaces  |
| Text        | `text-foreground`, `text-muted-foreground`, `text-card-foreground`    | Body, secondary, on-surface text        |
| Brand       | `bg-primary` / `text-primary-foreground`, `bg-secondary`, `bg-accent` | Primary actions, accents                |
| Feedback    | `bg-destructive` / `text-destructive-foreground`                      | Errors, delete actions                  |
| Lines       | `border-border`, `border-input`, `ring-ring`                          | Borders, inputs, focus rings            |
| Charts      | `fill-chart-1` … `fill-chart-5` (or `var(--chart-N)`)                 | Recharts series — never pick ad-hoc hex |
| Radius      | `rounded-sm` / `rounded-md` / `rounded-lg` / `rounded-xl`             | All corners (scale off `--radius`)      |
| Shadow      | `shadow-xs` … `shadow-2xl`                                            | Elevation                               |
| Type scale  | `text-step--2` … `text-step-5`                                        | Fluid headings/body (Utopia scale)      |
| Tracking    | `tracking-tight` / `tracking-normal` / `tracking-wide`                | Letter-spacing                          |

**Rules:**

- Never hardcode a color (`#0f172a`, `oklch(...)`, `rgb(...)`) or arbitrary class (`bg-[#...]`, `text-[14px]`). Reach for the token utility instead.
- Need a value with no utility? Reference the CSS var directly: `style={{ color: "var(--primary)" }}` or `className="bg-[var(--accent)]"` — don't reinvent the value.
- Tokens flip automatically in `.dark`. Write light-mode classes; dark mode follows. Don't add `dark:` overrides for colors that are already tokenized.
- Missing a token you genuinely need? Add it to `styles/design-tokens.css` (both `:root` and `.dark`, plus the `@theme inline` map) — don't inline a one-off.

## shadcn/ui Primitives

| Component    | Import                        | Used By                                     |
| ------------ | ----------------------------- | ------------------------------------------- |
| Button       | `components/ui/button`        | Everywhere                                  |
| ButtonGroup  | `components/ui/button-group`  | —                                           |
| Card         | `components/ui/card`          | Settings sections, stat cards               |
| Dialog       | `components/ui/dialog`        | Delete confirm, edit, profile, transfer     |
| Sheet        | `components/ui/sheet`         | Mobile sidebar                              |
| Table        | `components/ui/table`         | Comments, users tables                      |
| Tabs         | `components/ui/tabs`          | Elements page                               |
| Select       | `components/ui/select`        | Role picker, theme picker                   |
| Badge        | `components/ui/badge`         | Role badges, status badges, nav counts      |
| Skeleton     | `components/ui/skeleton`      | All `loading.tsx` files                     |
| Avatar       | `components/ui/avatar`        | User display, team members                  |
| Input        | `components/ui/input`         | Forms, search                               |
| Textarea     | `components/ui/textarea`      | Allowed origins                             |
| Checkbox     | `components/ui/checkbox`      | Bulk select, auto-approve                   |
| Switch       | `components/ui/switch`        | Toggle settings                             |
| Tooltip      | `components/ui/tooltip`       | Icon hints                                  |
| Separator    | `components/ui/separator`     | Visual dividers                             |
| Label        | `components/ui/label`         | Form labels                                 |
| ScrollArea   | `components/ui/scroll-area`   | Sidebar, filter panel                       |
| Sonner       | `components/ui/sonner`        | Toast notifications (via `toast.success()`) |
| Chart        | `components/ui/chart`         | Recharts wrapper                            |
| DropdownMenu | `components/ui/dropdown-menu` | Row actions, user menu                      |

## Dashboard Components

| Component                   | Path                                                       | Type   | Use                                              |
| --------------------------- | ---------------------------------------------------------- | ------ | ------------------------------------------------ |
| `AppSidebar`                | `dashboard/app-sidebar`                                    | Client | Main nav sidebar                                 |
| `PageHeader`                | `dashboard/page-header`                                    | Server | Page title + description + action slot           |
| `SiteSubNav`                | `dashboard/site-sub-nav`                                   | Client | Site tab navigation (role-filtered)              |
| `SiteNav`                   | `dashboard/site-nav`                                       | Client | Legacy site sidebar                              |
| `StatCard`                  | `dashboard/stat-card`                                      | Server | Metric tile: `{ title, value, icon, variant }`   |
| `SiteSparkline`             | `dashboard/site-sparkline`                                 | Client | Inline area chart: `{ data: number[], id }`      |
| `CommentActivityChart`      | `dashboard/comment-activity-chart`                         | Client | 30-day area chart: `{ data: {date, count}[] }`   |
| `CommentStatusChart`        | `dashboard/comment-status-chart`                           | Client | Donut chart: `{ approved, pending, spam }`       |
| `CommentsTable`             | `dashboard/comments-table`                                 | Client | Comment list + bulk actions + optimistic updates |
| `UsersTable`                | `dashboard/users-table`                                    | Client | User list + ban/unban + notification toggle      |
| `CommentSearchInput`        | `dashboard/comment-search-input`                           | Client | Debounced search → URL `?search=`                |
| `UserSearchInput`           | `dashboard/user-search-input`                              | Client | Same pattern for users                           |
| `PagesFilterPanel`          | `dashboard/pages-filter-panel`                             | Client | Left sidebar page filter + delete                |
| `InstallSnippet`            | `dashboard/install-snippet`                                | Client | Code display + clipboard copy                    |
| `UserProfileDialog`         | `dashboard/user-profile-dialog`                            | Client | Profile modal + comment history                  |
| `TeamManager`               | `dashboard/team/team-manager`                              | Client | Invite form + members + invites list             |
| `SiteSettingsForm`          | `dashboard/site-settings-form/`                            | Client | Orchestrator → 6 section components              |
| `GeneralSection`            | `dashboard/site-settings-form/general-section`             | Client | Name, domain, origins, auto-approve              |
| `AppearanceSection`         | `dashboard/site-settings-form/appearance-section`          | Client | Theme, color, radius, preview                    |
| `EmailNotificationsSection` | `dashboard/site-settings-form/email-notifications-section` | Client | SMTP, email appearance, toggle                   |
| `TransferSection`           | `dashboard/site-settings-form/transfer-section`            | Client | Multi-step ownership transfer                    |
| `DangerZoneSection`         | `dashboard/site-settings-form/danger-zone-section`         | Client | Delete site with confirm                         |
| `InstallSnippetSection`     | `dashboard/site-settings-form/install-snippet-section`     | Server | Embed code card                                  |
| `ThemeToggle`               | `components/theme-toggle`                                  | Client | Dark/light mode                                  |
| `Logo`                      | `components/logo`                                          | Server | Brand logo from config                           |

## Loading / Error / Empty States

| Pattern        | Implementation                                                                        |
| -------------- | ------------------------------------------------------------------------------------- |
| Loading        | `loading.tsx` files with `Skeleton` matching layout dimensions                        |
| Error          | `error.tsx` with AlertTriangle icon + "Try again" + nav button                        |
| Empty          | Dashed border box with icon, heading, description, CTA                                |
| Inline loading | `toast.success()`/`toast.error()`, button `disabled` + text change, `Loader2` spinner |
| Optimistic     | `useMutation`'s `onMutate` updates the React Query cache, `onError` rolls it back     |
