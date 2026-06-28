"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  RiFileTextLine,
  RiLayoutLeftLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiCheckLine,
  RiExternalLinkLine,
  RiSearchLine,
} from "@remixicon/react"
import { useDeletePage } from "@/lib/queries/pages"

type Page = { id: string; slug: string; url?: string; count: number }

type Props = {
  siteId: string
  pages: Page[]
  activeSlug?: string
  activeStatus?: string
  search?: string
}

export function PagesFilterPanel({
  siteId,
  pages,
  activeSlug,
  activeStatus,
  search,
}: Props) {
  const router = useRouter()
  const deletePage = useDeletePage(siteId)
  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter] = useState("")
  const [target, setTarget] = useState<Page | null>(null)
  const [typed, setTyped] = useState("")
  const [copied, setCopied] = useState(false)

  const filteredPages = filter
    ? pages.filter((p) => p.slug.toLowerCase().includes(filter.toLowerCase()))
    : pages

  function openDelete(page: Page, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setTarget(page)
    setTyped("")
    setCopied(false)
  }

  function closeDialog() {
    if (deletePage.isPending) return
    setTarget(null)
    setTyped("")
    setCopied(false)
  }

  async function copySlug() {
    if (!target) return
    try {
      await navigator.clipboard.writeText(target.slug)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Copy failed")
    }
  }

  function confirmDelete() {
    if (!target || typed !== target.slug) return
    const slug = target.slug
    deletePage.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Deleted "${slug}"`)
        const wasActive = activeSlug === slug
        setTarget(null)
        setTyped("")
        if (wasActive) {
          router.push(`/dashboard/sites/${siteId}/comments`)
        } else {
          router.refresh()
        }
      },
      onError: () => {
        toast.error("Failed to delete page")
      },
    })
  }

  function pageHref(slug: string | null) {
    const base = `/dashboard/sites/${siteId}/comments`
    const params = new URLSearchParams()
    if (activeStatus && activeStatus !== "ALL")
      params.set("status", activeStatus)
    if (slug) params.set("slug", slug)
    if (search) params.set("search", search)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  if (collapsed) {
    return (
      <div className="sticky top-22 flex h-[calc(100svh-5.5rem)] w-10 shrink-0 flex-col items-center gap-2 border-r px-1.5 pt-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setCollapsed(false)}
          aria-label="Show pages panel"
        >
          <RiLayoutLeftLine className="size-3.5" />
        </Button>
      </div>
    )
  }

  const canConfirm = !!target && typed === target.slug && !deletePage.isPending

  return (
    <div className="sticky top-22 flex h-[calc(100svh-5.5rem)] w-[230px] shrink-0 flex-col border-r bg-background">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Pages
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-1 size-6"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse pages panel"
        >
          <RiCloseLine className="size-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-1.5">
          {/* All pages */}
          <Link
            href={pageHref(null)}
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
              !activeSlug
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <span className="flex-1 text-xs">All pages</span>
          </Link>

          <div className="relative mt-1">
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter pages…"
              className="h-7 pr-6 pl-7 text-xs"
            />
            {filter && (
              <button
                onClick={() => setFilter("")}
                aria-label="Clear filter"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <RiCloseLine className="size-3.5" />
              </button>
            )}
          </div>

          <Separator className="my-1" />

          {filteredPages.map((p) => (
            <div
              key={p.id}
              className={`group relative flex items-center rounded-md transition-colors ${
                activeSlug === p.slug
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Link
                href={pageHref(p.slug)}
                title={p.slug}
                className={`flex min-w-0 flex-1 items-center gap-x-2 px-2.5 py-1.5 ${
                  activeSlug === p.slug ? "font-medium" : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                  <RiFileTextLine className="size-3.5 shrink-0 opacity-50" />
                  <span className="text-xs leading-snug whitespace-nowrap">
                    {p.slug}
                  </span>
                </div>
                {p.count > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 min-w-4 shrink-0 px-1 text-xs leading-none group-hover:hidden"
                  >
                    {p.count}
                  </Badge>
                )}
              </Link>
              <div className="absolute inset-y-0 right-0 hidden items-center gap-0.5 rounded-r-md bg-gradient-to-l from-accent from-60% to-transparent pr-1 pl-4 group-hover:flex">
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open page"
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <RiExternalLinkLine className="size-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => openDelete(p, e)}
                  aria-label={`Delete page ${p.slug}`}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <RiDeleteBinLine className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
            <DialogDescription>
              This permanently deletes the page and{" "}
              <span className="font-medium text-foreground">
                {target?.count ?? 0}{" "}
                {target?.count === 1 ? "comment" : "comments"}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Type the page name to confirm:
            </label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5">
              <code className="flex-1 truncate font-mono text-xs text-foreground">
                {target?.slug}
              </code>
              <button
                type="button"
                onClick={copySlug}
                aria-label="Copy page name"
                className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {copied ? (
                  <RiCheckLine className="size-3.5 text-emerald-600" />
                ) : (
                  <RiFileCopyLine className="size-3.5" />
                )}
              </button>
            </div>
            <Input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Paste or type the page name"
              disabled={deletePage.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canConfirm) confirmDelete()
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={deletePage.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!canConfirm}
            >
              {deletePage.isPending ? "Deleting…" : "Delete page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
