import type { Metadata } from "next"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import config from "@/config/config.json"
import pkg from "@/package.json"
import { cn } from "@/lib/utils"
import { getListPage } from "@/lib/content"
import { markdownify } from "@/lib/text-converter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  MessageSquare,
  Globe,
  ShieldCheck,
  Zap,
  Code2,
  Gift,
  ArrowRight,
  Check,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { HeroVideo } from "@/components/hero-video"
import { ProductHuntBadge } from "@/components/product-hunt-badge"
import { ProductSchema } from "@/components/product-schema"

export const metadata: Metadata = {
  description: config.metadata.meta_description,
  authors: [{ name: config.metadata.meta_author }],
  openGraph: {
    description: config.metadata.meta_description,
    images: [config.metadata.meta_image],
  },
  twitter: {
    card: "summary_large_image",
    description: config.metadata.meta_description,
    images: [config.metadata.meta_image],
  },
}

const iconMap: Record<string, LucideIcon> = {
  Globe,
  ShieldCheck,
  MessageSquare,
  Zap,
  Code2,
  Gift,
}

const embedSnippet = `<div
  data-open-remark
  data-site-key="YOUR_SITE_KEY"
  data-slug="/posts/hello-world"
></div>
<script async src="${process.env.NEXT_PUBLIC_APP_URL}/embed.js"></script>`

export default function HomePage() {
  const { frontmatter } = getListPage("homepage.md")
  const { hero, features, pricing, howItWorks, cta } = frontmatter
  const { plans } = pricing

  return (
    <div className="flex min-h-svh flex-col">
      {/* Product structured data (JSON-LD) for SEO */}
      <ProductSchema plans={plans} />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <nav
          className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4"
          aria-label="Main navigation"
        >
          <Link href="/" className="flex items-center font-semibold">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link
                href="https://github.com/zeon-studio/open-remark"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open OpenRemark GitHub repository"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                  aria-hidden="true"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.805 1.305 3.49.997.108-.775.42-1.305.762-1.605-2.665-.304-5.466-1.335-5.466-5.935 0-1.31.47-2.38 1.235-3.22-.125-.303-.535-1.525.115-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.655 1.65.245 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.625-5.475 5.92.43.37.81 1.1.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.21.69.825.575C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </Link>
            </Button>
            <ProductHuntBadge className="hidden sm:block" />
            {config.need_help.enable && (
              <Button asChild variant="outline">
                <Link
                  href={config.need_help.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config.need_help.label}
                </Link>
              </Button>
            )}
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/sign-in">
                Get started
                <ArrowRight className="ml-1 size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="relative mx-auto max-w-5xl overflow-hidden px-4 pt-28 pb-16 text-center">
          <Link href="/changelog" className="inline-block">
            <Badge
              variant="secondary"
              className="mb-5 rounded-sm px-3 py-3 text-sm transition-colors hover:bg-secondary/80"
            >
              v{pkg.version} · see what&apos;s new
              <ArrowRight className="ml-1 size-3.5" aria-hidden="true" />
            </Badge>
          </Link>
          <h1 className="mb-6 text-step-5 leading-[1.1] font-bold tracking-tight text-balance">
            <span dangerouslySetInnerHTML={markdownify(hero.title)}></span>
            <span className="animate-pulse">_</span>
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {hero.subtitle}
          </p>
          <div className="mb-16 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="h-13 px-8 text-base">
              <Link href={hero.primaryButton.link}>
                {hero.primaryButton.label}
                <ArrowRight className="ml-2 size-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 px-8 text-base"
            >
              <Link
                href={hero.secondaryButton.link}
                target="_blank"
                rel="noopener"
              >
                {hero.secondaryButton.label}
              </Link>
            </Button>
          </div>

          {/* Video */}
          <div className="relative">
            {/* Ambient glow behind card */}
            <div
              className="pointer-events-none absolute inset-x-0 -bottom-6 mx-auto h-24 w-2/3 rounded-full bg-primary/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-xl shadow-2xl ring-1 ring-primary/10">
              <HeroVideo />
            </div>
          </div>
        </section>

        {/* Code snippet */}
        <section className="border-y bg-muted/40 py-16">
          <div className="mx-auto max-w-3xl px-4">
            <p className="mb-6 text-center text-step--1 font-medium tracking-wider text-muted-foreground uppercase">
              Embed in 2 lines
            </p>
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-3">
                <div
                  className="size-2.5 rounded-full bg-red-400"
                  aria-hidden="true"
                />
                <div
                  className="size-2.5 rounded-full bg-yellow-400"
                  aria-hidden="true"
                />
                <div
                  className="size-2.5 rounded-full bg-green-400"
                  aria-hidden="true"
                />
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  your-post.html
                </span>
              </div>
              <pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed">
                <code>{embedSnippet}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-4 py-28">
          <h2 className="mb-4 text-center text-step-3 font-bold text-balance">
            {features.heading}
          </h2>
          <p className="mb-14 text-center text-step-1 text-balance text-muted-foreground">
            {features.subheading}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- markdown content is untyped by design */}
            {features.items.map((item: any) => {
              const Icon = iconMap[item.icon]
              return (
                <div
                  key={item.title}
                  className="flex flex-col gap-4 rounded-xl border bg-card p-6"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-step-0 font-semibold">{item.title}</h3>
                    <p className="text-step--1 leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-5xl px-4 py-28" id="pricing">
          <h2 className="mb-4 text-center text-step-3 font-bold text-balance">
            {pricing.heading}
          </h2>
          <p className="mb-14 text-center text-step-1 text-balance text-muted-foreground">
            {pricing.subheading}
          </p>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- markdown content is untyped by design */}
            {plans.map((plan: any) => {
              const Icon = iconMap[plan.icon]
              return (
                <Card
                  key={plan.name}
                  className={cn(
                    "relative gap-4 rounded-2xl shadow-none ring-0",
                    plan.highlighted &&
                      "border-primary/20 bg-gradient-to-br from-secondary to-card"
                  )}
                >
                  {plan.urgencyBadge && (
                    <div className="absolute top-6 right-6 flex flex-col items-end gap-1.5">
                      {plan.urgencyBadge && (
                        <Badge
                          variant="destructive"
                          className="rounded-sm border border-primary/5 px-2 py-2.5"
                        >
                          {plan.urgencyBadge}
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardHeader className="gap-3">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md",
                        plan.highlighted ? "bg-primary/15" : "bg-primary/10"
                      )}
                    >
                      <Icon
                        className="size-5 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-step-1 font-semibold">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-step-4 font-bold",
                          plan.highlighted &&
                            "bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent"
                        )}
                      >
                        {plan.price}
                      </span>
                      <span className="text-step--1 text-muted-foreground">
                        / {plan.period}
                      </span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <Separator />
                  <CardContent className="flex-1">
                    {plan.includesNote && (
                      <p className="mb-3 text-step--1 font-medium text-muted-foreground">
                        {plan.includesNote}
                      </p>
                    )}
                    <ul className="flex flex-col gap-3">
                      {plan.features.map((f: string) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-step--1"
                        >
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className="w-full"
                      size={"lg"}
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      {plan.cta.external ? (
                        <Link
                          href={plan.cta.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {plan.cta.label}
                          <span className="sr-only"> (opens in new tab)</span>
                        </Link>
                      ) : (
                        <Link href={plan.cta.link}>{plan.cta.label}</Link>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
          <p className="mt-8 text-center text-step--1 text-muted-foreground">
            {pricing.footnote}
          </p>
        </section>

        {/* How it works */}
        <section className="border-y bg-muted/40 py-28">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-14 text-center text-step-3 font-bold text-balance">
              {howItWorks.heading}
            </h2>
            <ol className="flex flex-col gap-10" aria-label="Setup steps">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- markdown content is untyped by design */}
              {howItWorks.steps.map((item: any) => (
                <li key={item.step} className="flex gap-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-step-0 font-semibold">
                      {item.title}
                    </h3>
                    <p className="text-step-0 text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-2xl px-4 py-28 text-center">
          <h2 className="mb-5 text-step-4 font-bold text-balance">
            {cta.heading}
          </h2>
          <p className="mb-10 text-step-1 leading-relaxed text-balance text-muted-foreground">
            {cta.subtitle}
          </p>
          <Button asChild size="lg" className="h-13 px-8 text-base">
            <Link href={cta.button.link}>
              {cta.button.label}
              <ArrowRight className="ml-2 size-5" aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </main>

      <ThemeToggle />

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />

          <p>
            An open source project by{" "}
            <Link
              href="https://zeon.studio?ref=openremark"
              target="_blank"
              rel="noopener"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Zeon Studio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
