import Link from "next/link"
import { auth } from "@/lib/auth"
import { getSitesForUser } from "@/lib/services/site-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { SiteSparkline } from "@/components/dashboard/site-sparkline"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { siteCan } from "@/lib/permissions"
import { SiteLogo } from "@/components/ui/site-logo"
import {
  RiAddLine,
  RiGlobalLine,
  RiMessage2Line,
  RiTimeLine,
  RiFileList2Line,
  RiSettings3Line,
  RiCodeLine,
} from "@remixicon/react"

export default async function SitesPage() {
  const session = await auth()
  const sites = await getSitesForUser(session!.user!.id as string)

  return (
    <div>
      <PageHeader
        title="Sites"
        description="Manage your registered sites"
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/sites/new">
              <RiAddLine className="size-4" aria-hidden="true" />
              Add Site
            </Link>
          </Button>
        }
      />

      <div className="p-4 sm:p-6">
        {sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <RiGlobalLine
              className="mb-4 size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="mb-1 text-lg font-semibold text-balance">
              No sites yet
            </h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              Register your first site to start embedding the comment widget on
              your Astro, Hugo, or Next.js blog.
            </p>
            <Button asChild>
              <Link href="/dashboard/sites/new">
                <RiAddLine className="size-4" aria-hidden="true" />
                Add your first site
              </Link>
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(415px,1fr))]">
              {sites.map((site) => (
                <Card
                  key={site.id}
                  className="flex w-full flex-col gap-0 py-0 shadow-none transition-shadow hover:shadow-md hover:ring-ring/20 dark:hover:ring-ring/30"
                >
                  {/* Header */}
                  <CardHeader className="flex flex-row items-start gap-3 p-5 pb-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted">
                      <SiteLogo
                        domain={site.domain}
                        size={28}
                        className="rounded-sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base leading-tight font-semibold">
                        {site.name}
                      </p>
                      <a
                        href={
                          site.domain.startsWith("http")
                            ? site.domain
                            : `https://${site.domain}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground hover:underline"
                      >
                        <RiGlobalLine
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {site.domain}
                      </a>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 px-1.5 py-0 text-xs",
                        site.autoApprove
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-warning/30 bg-warning/10 text-warning"
                      )}
                    >
                      {site.autoApprove ? "Auto-approve" : "Moderated"}
                    </Badge>
                  </CardHeader>

                  {/* Stats + Sparkline */}
                  <CardContent className="border-t px-5 py-4">
                    <div className="flex items-center gap-3">
                      {/* Stats */}
                      <div className="flex flex-1 items-center divide-x">
                        <div className="flex flex-1 flex-col pr-4">
                          <span className="text-lg leading-tight font-semibold tabular-nums">
                            {site.totalComments}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <RiMessage2Line
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Comments
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col px-4">
                          <span
                            className={cn(
                              "text-lg leading-tight font-semibold tabular-nums",
                              site.pendingComments > 0 && "text-warning"
                            )}
                          >
                            {site.pendingComments}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <RiTimeLine
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Pending
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col pl-4">
                          <span className="text-lg leading-tight font-semibold tabular-nums">
                            {site._count.pages}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <RiFileList2Line
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Pages
                          </span>
                        </div>
                      </div>
                      {/* Sparkline */}
                      <div className="w-[110px] shrink-0">
                        <SiteSparkline data={site.sparkline} id={site.id} />
                      </div>
                    </div>
                  </CardContent>

                  {/* Footer actions */}
                  <CardFooter className="gap-2 border-t px-3 py-3">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/dashboard/sites/${site.id}/comments`}>
                        <RiMessage2Line className="size-4" aria-hidden="true" />
                        Comments
                      </Link>
                    </Button>
                    {siteCan(site.role, "MANAGE_SETTINGS") && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              asChild
                              variant="outline"
                              size="icon-sm"
                              aria-label={`Install widget for ${site.name}`}
                            >
                              <Link
                                href={`/dashboard/sites/${site.id}/install`}
                              >
                                <RiCodeLine
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Install widget</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              asChild
                              variant="outline"
                              size="icon-sm"
                              aria-label={`Settings for ${site.name}`}
                            >
                              <Link
                                href={`/dashboard/sites/${site.id}/settings`}
                              >
                                <RiSettings3Line
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Settings</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
