import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { getSiteForMember } from "@/lib/services/membership-service"
import { getCommentsBySite } from "@/lib/services/comment-service"
import { getPagesForSite } from "@/lib/services/page-service"
import { CommentsTable } from "@/components/dashboard/comments-table"
import { PagesFilterPanel } from "@/components/dashboard/pages-filter-panel"
import { CommentSearchInput } from "@/components/dashboard/comment-search-input"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CommentStatus } from "@/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{
    status?: string
    slug?: string
    page?: string
    search?: string
  }>
}

const STATUSES = ["ALL", "PENDING", "APPROVED", "SPAM", "DELETED"] as const
const LIMIT = 20

export default async function CommentsPage({ params, searchParams }: Props) {
  const { siteId } = await params
  const { status, slug, page: pageParam, search } = await searchParams

  const session = await auth()

  try {
    await getSiteForMember(siteId, session!.user!.id)
  } catch {
    notFound()
  }

  const activeStatus =
    status && status !== "ALL" ? (status as CommentStatus) : undefined
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10))

  const pages = await getPagesForSite(siteId)

  function statusHref(s: string) {
    const base = `/dashboard/sites/${siteId}/comments`
    const params = new URLSearchParams()
    if (s && s !== "ALL") params.set("status", s)
    if (slug) params.set("slug", slug)
    if (search) params.set("search", search)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  const suspenseKey = `${activeStatus ?? "ALL"}|${slug ?? ""}|${currentPage}|${search ?? ""}`

  return (
    <div className="flex h-full min-h-0">
      {/* Pages panel — only shown when there are pages */}
      {pages.length > 0 && (
        <PagesFilterPanel
          siteId={siteId}
          pages={pages.map((p) => ({
            id: p.id,
            slug: p.slug,
            url: p.url ?? undefined,
            count: p._count.comments,
          }))}
          activeSlug={slug}
          activeStatus={status}
          search={search}
        />
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1 overflow-auto">
        {/* Page toolbar */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b bg-background px-6 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="shrink-0 text-base font-semibold">Comments</h1>
            {slug && (
              <Badge
                variant="secondary"
                className="max-w-52 truncate text-xs font-normal"
              >
                {slug}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <CommentSearchInput />

            {/* Status filters */}
            <ButtonGroup>
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  asChild
                  variant={
                    (s === "ALL" && !status) || s === status
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-7 px-3 text-xs"
                >
                  <Link href={statusHref(s)}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </Link>
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>

        <Suspense key={suspenseKey} fallback={<CommentsAreaSkeleton />}>
          <CommentsArea
            siteId={siteId}
            status={status}
            slug={slug}
            currentPage={currentPage}
            search={search}
            activeStatus={activeStatus}
          />
        </Suspense>
      </div>
    </div>
  )
}

type AreaProps = {
  siteId: string
  status?: string
  slug?: string
  currentPage: number
  search?: string
  activeStatus?: CommentStatus
}

async function CommentsArea({
  siteId,
  status,
  slug,
  currentPage,
  search,
  activeStatus,
}: AreaProps) {
  const { comments, total, limit } = await getCommentsBySite(siteId, {
    status: activeStatus,
    slug: slug || undefined,
    page: currentPage,
    limit: LIMIT,
    search: search || undefined,
  })

  const totalPages = Math.ceil(total / limit)

  function buildHref(overrides: {
    status?: string
    slug?: string | null
    page?: number
    search?: string | null
  }) {
    const base = `/dashboard/sites/${siteId}/comments`
    const params = new URLSearchParams()

    const s =
      overrides.status ?? (status && status !== "ALL" ? status : undefined)
    if (s && s !== "ALL") params.set("status", s)

    const sl =
      overrides.slug !== undefined ? overrides.slug : (slug ?? undefined)
    if (sl) params.set("slug", sl)

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
      acc.push(-1) // ellipsis marker
    }
    acc.push(p)
    return acc
  }, [])

  return (
    <div className="p-6">
      <div className="mb-3 text-sm text-muted-foreground tabular-nums">
        {total} {total === 1 ? "comment" : "comments"}
      </div>

      <CommentsTable
        comments={comments as Parameters<typeof CommentsTable>[0]["comments"]}
        listKey={`${siteId}:${activeStatus ?? "ALL"}|${slug ?? ""}|${currentPage}|${search ?? ""}`}
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
  )
}

function CommentsAreaSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="mb-3 h-4 w-24" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
