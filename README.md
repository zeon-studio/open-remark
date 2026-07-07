# OpenRemark - An open-source comment system for static websites

<img width="1200" height="630" alt="image" src="https://github.com/user-attachments/assets/8c8728da-cf93-499c-81d1-a6db68f9f87c" />
<img width="1850" height="956" alt="image" src="https://github.com/user-attachments/assets/790db0b4-3fba-44d7-aec7-c0e6762290ae" />


![Beta](https://img.shields.io/badge/status-beta-orange) ![Version](https://img.shields.io/badge/version-0.6.1-blue) ![License](https://img.shields.io/badge/license-MIT-green)

<a href="https://www.producthunt.com/products/openremark?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-openremark" target="_blank" rel="noopener noreferrer"><img alt="OpenRemark - An open-source comment system for static websites | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1165618&theme=light&t=1780902380009"></a>

A self-hostable comment system for static websites — Astro, Hugo, Next.js, and any site that accepts HTML.

[**Live Demo**](https://open-remark.zeon.studio/demo.html)

**Features:** Google sign-in · threaded replies · spam/moderation dashboard · site teams &amp; roles · shadow DOM widget · origin allowlisting

## Quick start

```bash
# 1. Install
pnpm install

# 2. Configure
cp .env.example .env
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET, WIDGET_JWT_SECRET

# 3. Database
pnpm db:migrate
pnpm db:seed        # optional demo data

# 4. Run (also builds widget + generates Prisma client)
pnpm dev
```

Open `http://localhost:3000` — sign in with Google to access the dashboard.

## Embed on your site

```html
<!-- Paste anywhere in your post template -->
<div
  data-open-remark
  data-site-key="YOUR_SITE_KEY"
  data-slug="/posts/your-post-slug"
></div>
<script async src="https://your-domain.com/embed.js"></script>
```

Get your site key from **Dashboard → Sites → Install**.

## Framework guides

- [Astro](docs/embed-astro.md)
- [Hugo](docs/embed-hugo.md)
- [Next.js](docs/embed-nextjs.md)

## Architecture

See [docs/architecture.md](docs/architecture.md) for system design, request flows, and scaling path.

## Tech stack

| Layer       | Tech                      |
| ----------- | ------------------------- |
| Framework   | Next.js 16 App Router     |
| Database    | PostgreSQL (Prisma)       |
| ORM         | Prisma                    |
| Admin auth  | Auth.js v5 (Google OAuth) |
| Widget auth | Widget JWT (jose)         |
| UI          | shadcn/ui + Tailwind v4   |
| Validation  | Zod                       |
| Widget      | Vanilla TS → esbuild      |

## Environment variables

| Variable               | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/zeon`) |
| `AUTH_SECRET`          | Auth.js secret (run `openssl rand -base64 32`)                                   |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                                           |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                                       |
| `WIDGET_JWT_SECRET`    | JWT secret for widget visitor tokens                                             |
| `NEXT_PUBLIC_APP_URL`  | Public app URL (used in embed snippets)                                          |

## License

[MIT License](https://github.com/zeon-studio/open-remark/blob/main/LICENSE)

This project is maintained by [Zeon Studio](https://zeon.studio/?ref=openremark)
