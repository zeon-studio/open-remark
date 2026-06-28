import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { getSiteForMember } from "@/lib/services/membership-service"
import { getCommentersBySite } from "@/lib/services/user-service"
import { UsersTable } from "@/components/dashboard/users-table"
import { UserSearchInput } from "@/components/dashboard/user-search-input"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ page?: string; search?: string }>
}

const LIMIT = 20

export default async function UsersPage({ params, searchParams }: Props) {
  const { siteId } = await params
  const { page: pageParam, search } = await searchParams

  const session = await auth()

  let site
  try {
    const res = await getSiteForMember(siteId, session!.user!.id)
    site = res.site
  } catch {
    notFound()
  }

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10))

  const { commenters, total, limit } = await getCommentersBySite(siteId, {
    page: currentPage,
    limit: LIMIT,
    search: search || undefined,
  })

  const totalPages = Math.ceil(total / limit)

  function buildHref(overrides: { page?: number; search?: string | null }) {
    const base = `/dashboard/sites/${siteId}/users`
    const params = new URLSearchParams()

    const sr =
      overrides.search !== undefined ? overrides.search : (search ?? undefined)
    if (sr) params.set("search", sr)

    const p = overrides.page ?? currentPage
    if (p > 1) params.set("page", String(p))

    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  ).filter(
    (p) =>
      p === 1 ||
      p === totalPages ||
      (p >= currentPage - 1 && p <= currentPage + 1)
  )

  const dedupedPageNumbers = pageNumbers.reduce<number[]>((acc, p, i) => {
    if (i > 0 && p - pageNumbers[i - 1] > 1) {
      acc.push(-1)
    }
    acc.push(p)
    return acc
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b bg-background px-6 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="shrink-0 text-base font-semibold">Users</h1>
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {total} {total === 1 ? "user" : "users"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <UserSearchInput />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <UsersTable
          commenters={commenters}
          listKey={`${siteId}:page=${currentPage}:search=${search ?? ""}`}
          siteId={siteId}
          emailNotificationsEnabled={site.emailNotificationsEnabled}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={currentPage <= 1}
                asChild
              >
                <Link href={buildHref({ page: currentPage - 1 })}>
                  <ChevronLeft className="size-4" />
                </Link>
              </Button>

              {dedupedPageNumbers.map((p, i) =>
                p === -1 ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-sm text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    className="h-8 min-w-8 px-2.5"
                    asChild
                  >
                    <Link href={buildHref({ page: p })}>{p}</Link>
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={currentPage >= totalPages}
                asChild
              >
                <Link href={buildHref({ page: currentPage + 1 })}>
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
