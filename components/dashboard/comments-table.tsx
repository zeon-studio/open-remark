"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import {
  useCommentList,
  useUpdateCommentStatus,
  useUpdateCommentBody,
  useBulkUpdateCommentStatus,
} from "@/lib/queries/comments"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Check,
  MoreHorizontal,
  ShieldAlert,
  Trash2,
  Eye,
  Pencil,
  ExternalLink,
} from "lucide-react"

const COMMENT_STATUS = {
  APPROVED: "APPROVED",
  PENDING: "PENDING",
  SPAM: "SPAM",
  DELETED: "DELETED",
} as const

type CommentStatus = (typeof COMMENT_STATUS)[keyof typeof COMMENT_STATUS]

type Comment = {
  id: string
  body: string
  commenter: {
    name: string
    email: string
    image: string | null
  }
  status: CommentStatus
  createdAt: Date
  editedAt?: Date | null
  page: { slug: string; url: string | null }
}

type Props = {
  comments: Comment[]
  listKey: string
}

const STATUS_BADGE: Record<
  CommentStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    className?: string
  }
> = {
  APPROVED: { label: "Approved", variant: "default" },
  PENDING: { label: "Pending", variant: "secondary" },
  SPAM: {
    label: "Spam",
    variant: "outline",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
  },
  DELETED: {
    label: "Deleted",
    variant: "outline",
    className:
      "border-border bg-muted text-muted-foreground line-through decoration-muted-foreground/40",
  },
}

export function CommentsTable({ comments, listKey }: Props) {
  const [preview, setPreview] = useState<Comment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null)
  const [editTarget, setEditTarget] = useState<Comment | null>(null)
  const [editBody, setEditBody] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<"DELETE" | "SPAM" | null>(null)

  const { data: liveComments } = useCommentList<Comment>(listKey, comments)
  const updateStatus = useUpdateCommentStatus<Comment>(listKey)
  const updateBody = useUpdateCommentBody<Comment>(listKey)
  const bulkUpdateStatus = useBulkUpdateCommentStatus<Comment>(listKey)
  const bulkBusy = bulkUpdateStatus.isPending

  function isBusy(id: string) {
    return (
      (updateStatus.isPending && updateStatus.variables?.id === id) ||
      (updateBody.isPending && updateBody.variables?.id === id)
    )
  }

  const selectableIds = useMemo(
    () =>
      liveComments
        .filter((c) => c.status !== COMMENT_STATUS.DELETED)
        .map((c) => c.id),
    [liveComments]
  )

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))
  const someSelected = selectedIds.size > 0 && !allSelected

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(selectableIds) : new Set())
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function runBulk(status: CommentStatus) {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    bulkUpdateStatus.mutate(
      { ids, status },
      {
        onSuccess: () => {
          toast.success(
            `${ids.length} comment${ids.length === 1 ? "" : "s"} ${status.toLowerCase()}`
          )
          setSelectedIds(new Set())
        },
        onError: () => toast.error("Bulk action failed. Changes reverted."),
        onSettled: () => setBulkAction(null),
      }
    )
  }

  function handleStatusChange(
    id: string,
    status: CommentStatus
  ): Promise<void> {
    return new Promise((resolve) => {
      updateStatus.mutate(
        { id, status },
        {
          onSuccess: () => toast.success(`Comment ${status.toLowerCase()}`),
          onError: () => toast.error("Action failed. Changes reverted."),
          onSettled: () => resolve(),
        }
      )
    })
  }

  function handleBodyUpdate(id: string, body: string) {
    setEditTarget(null)
    updateBody.mutate(
      { id, body },
      {
        onSuccess: () => toast.success("Comment updated"),
        onError: () => toast.error("Update failed. Changes reverted."),
      }
    )
  }

  if (liveComments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">No comments found</p>
      </div>
    )
  }

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
          <p className="text-sm">
            <span className="font-medium">{selectedIds.size}</span> selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={bulkBusy}
              onClick={() => setBulkAction("SPAM")}
            >
              <ShieldAlert
                className="text-warning mr-1.5 size-4"
                aria-hidden="true"
              />
              Mark as spam
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={bulkBusy}
              onClick={() => setBulkAction("DELETE")}
            >
              <Trash2 className="mr-1.5 size-4" aria-hidden="true" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkBusy}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  disabled={selectableIds.length === 0 || bulkBusy}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Select all comments"
                />
              </TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {liveComments.map((comment) => {
              const badge = STATUS_BADGE[comment.status]
              const isDeleted = comment.status === COMMENT_STATUS.DELETED
              return (
                <TableRow
                  key={comment.id}
                  data-state={
                    selectedIds.has(comment.id) ? "selected" : undefined
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(comment.id)}
                      disabled={isDeleted || bulkBusy}
                      onCheckedChange={(v) => toggleOne(comment.id, v === true)}
                      aria-label={`Select comment by ${comment.commenter.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="size-7 shrink-0">
                        <AvatarImage
                          src={comment.commenter.image ?? undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {comment.commenter.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {comment.commenter.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {comment.commenter.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p
                      className={
                        comment.status === COMMENT_STATUS.DELETED
                          ? "text-sm text-muted-foreground italic"
                          : "line-clamp-2 text-sm"
                      }
                    >
                      {comment.status === COMMENT_STATUS.DELETED
                        ? "Comment Removed"
                        : comment.body}
                    </p>
                  </TableCell>
                  <TableCell>
                    {comment.page.url ? (
                      <a
                        href={`${comment.page.url}#comment-${comment.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex max-w-36 items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                      >
                        <span className="truncate">{comment.page.slug}</span>
                        <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100" />
                      </a>
                    ) : (
                      <p className="max-w-36 truncate font-mono text-xs text-muted-foreground">
                        {comment.page.slug}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge.variant} className={badge.className}>
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={isBusy(comment.id)}
                          aria-label={`Actions for comment by ${comment.commenter.name}`}
                        >
                          <MoreHorizontal
                            className="size-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreview(comment)}>
                          <Eye className="mr-2 size-4" aria-hidden="true" />
                          View full
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditTarget(comment)
                            setEditBody(comment.body)
                          }}
                        >
                          <Pencil className="mr-2 size-4" aria-hidden="true" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {comment.status !== COMMENT_STATUS.APPROVED && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(
                                comment.id,
                                COMMENT_STATUS.APPROVED
                              )
                            }
                          >
                            <Check
                              className="text-success mr-2 size-4"
                              aria-hidden="true"
                            />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {comment.status !== COMMENT_STATUS.SPAM && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(
                                comment.id,
                                COMMENT_STATUS.SPAM
                              )
                            }
                          >
                            <ShieldAlert
                              className="text-warning mr-2 size-4"
                              aria-hidden="true"
                            />
                            Mark as spam
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(comment)}
                        >
                          <Trash2 className="mr-2 size-4" aria-hidden="true" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comment by {preview?.commenter.name}</DialogTitle>
            <DialogDescription>{preview?.commenter.email}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
            {preview?.body}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              On <span className="font-mono">{preview?.page.slug}</span>
            </p>
            {preview?.editedAt && (
              <span className="text-xs text-muted-foreground">· edited</span>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete comment?</DialogTitle>
            <DialogDescription>
              This comment will be marked as deleted. Replies will remain
              visible.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isBusy(deleteTarget?.id ?? "")}
              onClick={async () => {
                if (!deleteTarget) return
                await handleStatusChange(
                  deleteTarget.id,
                  COMMENT_STATUS.DELETED
                )
                setDeleteTarget(null)
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!bulkAction}
        onOpenChange={(open) => !open && !bulkBusy && setBulkAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "DELETE"
                ? `Delete ${selectedIds.size} comment${selectedIds.size === 1 ? "" : "s"}?`
                : `Mark ${selectedIds.size} comment${selectedIds.size === 1 ? "" : "s"} as spam?`}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === "DELETE"
                ? "Selected comments will be marked as deleted. Replies remain visible."
                : "Selected comments will be hidden from readers."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={bulkBusy}
              onClick={() => setBulkAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction === "DELETE" ? "destructive" : "default"}
              disabled={bulkBusy}
              onClick={() =>
                runBulk(
                  bulkAction === "DELETE"
                    ? COMMENT_STATUS.DELETED
                    : COMMENT_STATUS.SPAM
                )
              }
            >
              {bulkAction === "DELETE" ? "Delete" : "Mark as spam"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit comment</DialogTitle>
            <DialogDescription>
              By {editTarget?.commenter.name}
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="min-h-[100px] w-full resize-none rounded-md border bg-background p-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            disabled={isBusy(editTarget?.id ?? "")}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={isBusy(editTarget?.id ?? "") || !editBody.trim()}
              onClick={() => {
                if (!editTarget) return
                handleBodyUpdate(editTarget.id, editBody)
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
