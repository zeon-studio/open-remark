"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { ClientCommentStatus } from "@/lib/queries/comments"
import { useUpdateCommentStatus } from "@/lib/queries/comments"
import { useCommenterComments } from "@/lib/queries/users"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, ShieldAlert, Trash2 } from "lucide-react"
import type { CommenterProfile } from "@/lib/types/commenter"

type CommentItem = {
  id: string
  body: string
  status: ClientCommentStatus
  createdAt: string
  editedAt?: string | null
  page: { slug: string; url: string | null }
  commenter: CommenterProfile
}

type Props = {
  open: boolean
  onClose: () => void
  commenter: CommenterProfile | null
  siteId: string
}

const STATUS_BADGE: Record<
  ClientCommentStatus,
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

export function UserProfileDialog({ open, onClose, commenter, siteId }: Props) {
  const [overrides, setOverrides] = useState<
    Record<string, ClientCommentStatus>
  >({})
  const updateStatus = useUpdateCommentStatus<CommentItem>(
    `profile:${siteId}:${commenter?.id ?? ""}`
  )
  const { data, isError } = useCommenterComments(siteId, commenter?.id, open)

  useEffect(() => {
    if (isError) toast.error("Failed to load comments")
  }, [isError])

  const comments: CommentItem[] | null = data
    ? data.map((c) => ({ ...c, status: overrides[c.id] ?? c.status }))
    : null

  function handleStatusChange(commentId: string, status: ClientCommentStatus) {
    updateStatus.mutate(
      { id: commentId, status },
      {
        onSuccess: () => {
          setOverrides((prev) => ({ ...prev, [commentId]: status }))
          toast.success(`Comment ${status.toLowerCase()}`)
        },
        onError: () => {
          toast.error("Action failed")
        },
      }
    )
  }

  if (!commenter) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={commenter.image ?? ""} />
              <AvatarFallback>
                {commenter.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{commenter.name}</DialogTitle>
              <DialogDescription>{commenter.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-auto">
          {comments === null ? (
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments</p>
          ) : (
            comments.map((comment) => {
              const badge = STATUS_BADGE[comment.status]
              return (
                <div
                  key={comment.id}
                  className="space-y-2 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={badge.variant} className={badge.className}>
                      {badge.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p
                    className={
                      comment.status === "DELETED"
                        ? "text-sm text-muted-foreground italic"
                        : "text-sm"
                    }
                  >
                    {comment.status === "DELETED"
                      ? "Comment Removed"
                      : comment.body}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {comment.page.slug}
                  </p>
                  <div className="flex gap-2 pt-1">
                    {comment.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() =>
                          handleStatusChange(comment.id, "APPROVED")
                        }
                      >
                        <Check className="mr-1 size-3" />
                        Approve
                      </Button>
                    )}
                    {comment.status !== "SPAM" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() => handleStatusChange(comment.id, "SPAM")}
                      >
                        <ShieldAlert className="mr-1 size-3" />
                        Spam
                      </Button>
                    )}
                    {comment.status !== "DELETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-destructive"
                        onClick={() =>
                          handleStatusChange(comment.id, "DELETED")
                        }
                      >
                        <Trash2 className="mr-1 size-3" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
