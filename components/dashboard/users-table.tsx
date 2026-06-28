"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  useCommenterList,
  useBanCommenter,
  useUnbanCommenter,
  useDeleteAllCommentsByCommenter,
  useToggleCommenterNotifications,
} from "@/lib/queries/users"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, ShieldAlert, Trash2, Eye } from "lucide-react"
import { UserProfileDialog } from "./user-profile-dialog"
import type {
  CommenterWithStats,
  CommenterProfile,
} from "@/lib/types/commenter"

type Props = {
  commenters: CommenterWithStats[]
  listKey: string
  siteId: string
  emailNotificationsEnabled: boolean
}

type ConfirmAction = "deleteAll" | "ban" | null

export function UsersTable({
  commenters,
  listKey,
  siteId,
  emailNotificationsEnabled,
}: Props) {
  const [profileUser, setProfileUser] = useState<CommenterProfile | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [confirmTarget, setConfirmTarget] = useState<CommenterWithStats | null>(
    null
  )

  const { data: liveCommenters } = useCommenterList<CommenterWithStats>(
    listKey,
    commenters
  )

  const banCommenter = useBanCommenter<CommenterWithStats>(siteId, listKey)
  const unbanCommenter = useUnbanCommenter<CommenterWithStats>(siteId, listKey)
  const deleteAllCommentsByCommenter =
    useDeleteAllCommentsByCommenter<CommenterWithStats>(siteId, listKey)
  const toggleCommenterNotifications =
    useToggleCommenterNotifications<CommenterWithStats>(siteId, listKey)

  function isBusy(commenterId: string) {
    return (
      (banCommenter.isPending && banCommenter.variables === commenterId) ||
      (unbanCommenter.isPending && unbanCommenter.variables === commenterId) ||
      (deleteAllCommentsByCommenter.isPending &&
        deleteAllCommentsByCommenter.variables === commenterId) ||
      (toggleCommenterNotifications.isPending &&
        toggleCommenterNotifications.variables?.commenterId === commenterId)
    )
  }

  function openConfirm(action: ConfirmAction, commenter: CommenterWithStats) {
    setConfirmAction(action)
    setConfirmTarget(commenter)
  }

  function closeConfirm() {
    setConfirmAction(null)
    setConfirmTarget(null)
  }

  function handleDeleteAll() {
    if (!confirmTarget) return
    const commenterId = confirmTarget.id
    closeConfirm()

    deleteAllCommentsByCommenter.mutate(commenterId, {
      onSuccess: () => toast.success("All comments deleted"),
      onError: () => toast.error("Failed to delete comments"),
    })
  }

  function handleBan() {
    if (!confirmTarget) return
    const commenterId = confirmTarget.id
    closeConfirm()

    banCommenter.mutate(commenterId, {
      onSuccess: () => toast.success("User banned"),
      onError: () => toast.error("Failed to ban user"),
    })
  }

  function handleToggleNotifications(commenterId: string, enabled: boolean) {
    toggleCommenterNotifications.mutate(
      { commenterId, notificationsEnabled: enabled },
      {
        onSuccess: () =>
          toast.success(
            enabled ? "Notifications enabled" : "Notifications disabled"
          ),
        onError: () => toast.error("Failed to update notification preference"),
      }
    )
  }

  function handleUnban(commenterId: string) {
    unbanCommenter.mutate(commenterId, {
      onSuccess: () => toast.success("Ban removed"),
      onError: () => toast.error("Failed to remove ban"),
    })
  }

  if (liveCommenters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">No users found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Deleted</TableHead>
              <TableHead>Spam</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Notification</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {liveCommenters.map((commenter) => (
              <TableRow
                key={commenter.id}
                className="cursor-pointer"
                onClick={() => setProfileUser(commenter)}
              >
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src={commenter.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {commenter.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {commenter.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {commenter.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {commenter.totalCount}
                </TableCell>
                <TableCell className="tabular-nums">
                  {commenter.deletedCount}
                </TableCell>
                <TableCell className="tabular-nums">
                  {commenter.spamCount}
                </TableCell>
                <TableCell>
                  {commenter.isBanned && (
                    <Badge variant="destructive">Banned</Badge>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={
                      emailNotificationsEnabled &&
                      commenter.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      handleToggleNotifications(commenter.id, checked)
                    }
                    disabled={
                      !emailNotificationsEnabled || isBusy(commenter.id)
                    }
                    aria-label={
                      commenter.notificationsEnabled
                        ? "Disable reply notifications"
                        : "Enable reply notifications"
                    }
                    title={
                      emailNotificationsEnabled
                        ? "Disables reply notifications for this commenter on throughout the site."
                        : "Email notifications are disabled for this site. Enable them in site settings first."
                    }
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={isBusy(commenter.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Actions for ${commenter.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setProfileUser(commenter)}
                      >
                        <Eye className="mr-2 size-4" />
                        View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openConfirm("deleteAll", commenter)
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete All Comments
                      </DropdownMenuItem>
                      {!commenter.isBanned ? (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            openConfirm("ban", commenter)
                          }}
                        >
                          <ShieldAlert className="mr-2 size-4" />
                          Ban user
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnban(commenter.id)
                          }}
                        >
                          <ShieldAlert className="mr-2 size-4 text-muted-foreground" />
                          Remove Ban
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserProfileDialog
        key={profileUser?.id || "closed"}
        open={!!profileUser}
        onClose={() => setProfileUser(null)}
        commenter={profileUser}
        siteId={siteId}
      />

      {/* Delete All Comments Confirmation */}
      <Dialog
        open={confirmAction === "deleteAll"}
        onOpenChange={(v) => !v && closeConfirm()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all comments?</DialogTitle>
            <DialogDescription>
              This will permanently soft-delete all {confirmTarget?.totalCount}{" "}
              comments by {confirmTarget?.name} on this site.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isBusy(confirmTarget?.id ?? "")}
              onClick={handleDeleteAll}
            >
              Delete all
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban User Confirmation */}
      <Dialog
        open={confirmAction === "ban"}
        onOpenChange={(v) => !v && closeConfirm()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban {confirmTarget?.name}?</DialogTitle>
            <DialogDescription>
              This will ban {confirmTarget?.name} from this site. They will no
              longer be able to post, like, edit, or delete comments.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isBusy(confirmTarget?.id ?? "")}
              onClick={handleBan}
            >
              Ban user
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
