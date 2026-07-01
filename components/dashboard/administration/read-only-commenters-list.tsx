// components/dashboard/administration/read-only-commenters-list.tsx
import type { CommenterWithStats } from "@/lib/types/commenter"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ReadOnlyCommentersList({
  commenters,
}: {
  commenters: CommenterWithStats[]
}) {
  if (commenters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        No commenters yet.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Commenter</TableHead>
          <TableHead>Comments</TableHead>
          <TableHead>Spam</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commenters.map((commenter) => (
          <TableRow key={commenter.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarImage
                    src={commenter.image ?? undefined}
                    alt={commenter.name}
                  />
                  <AvatarFallback>
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
              {commenter.spamCount}
            </TableCell>
            <TableCell>
              {commenter.isBanned ? (
                <Badge variant="destructive">Banned</Badge>
              ) : (
                <Badge variant="outline">Active</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
