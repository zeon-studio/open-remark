// app/dashboard/administration/users/[userId]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPlatformUserProfile } from "@/lib/services/platform-admin-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { SiteSparkline } from "@/components/dashboard/site-sparkline"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SiteLogo } from "@/components/ui/site-logo"
import { cn } from "@/lib/utils"
import {
  RiGlobalLine,
  RiMessage2Line,
  RiTimeLine,
  RiFileList2Line,
} from "@remixicon/react"

type Props = { params: Promise<{ userId: string }> }

export default async function AdminUserProfilePage({ params }: Props) {
  const { userId } = await params

  let user, sites
  try {
    const res = await getPlatformUserProfile(userId)
    user = res.user
    sites = res.sites
  } catch {
    notFound()
  }

  return (
    <div>
      <PageHeader
        title={user.name ?? user.email}
        description={`${sites.length} site${sites.length === 1 ? "" : "s"}`}
      />
      <div className="p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? user.email}
            />
            <AvatarFallback>
              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name ?? "Unnamed"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge
            variant={
              user.platformRole === "PLATFORM_OWNER" ? "default" : "outline"
            }
            className="ml-2"
          >
            {user.platformRole === "PLATFORM_OWNER" ? "Owner" : "User"}
          </Badge>
        </div>

        {sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <RiGlobalLine
              className="mb-4 size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="mb-1 text-lg font-semibold text-balance">
              No sites
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              This user doesn&apos;t own or belong to any sites yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(415px,1fr))]">
            {sites.map((site) => (
              <Link
                key={site.id}
                href={`/dashboard/administration/users/${userId}/sites/${site.id}`}
              >
                <Card className="flex w-full flex-col gap-0 py-0 shadow-none transition-shadow hover:shadow-md">
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
                      <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <RiGlobalLine
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {site.domain}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 px-1.5 py-0 text-xs"
                    >
                      {site.role.replace("SITE_", "")}
                    </Badge>
                  </CardHeader>
                  <CardContent className="border-t px-5 py-4">
                    <div className="flex items-center gap-3">
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
                      <div className="w-[110px] shrink-0">
                        <SiteSparkline data={site.sparkline} id={site.id} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
