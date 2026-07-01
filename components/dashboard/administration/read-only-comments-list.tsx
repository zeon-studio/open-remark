// components/dashboard/administration/read-only-comments-list.tsx
import type { getCommentsBySite } from "@/lib/services/comment-service"
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

type Comments = Awaited<ReturnType<typeof getCommentsBySite>>["comments"]

type BadgeVariant = "default" | "outline" | "secondary" | "destructive"

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: "outline",
  APPROVED: "default",
  SPAM: "destructive",
  DELETED: "secondary",
}

export function ReadOnlyCommentsList({ comments }: { comments: Comments }) {
  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        No comments yet.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Author</TableHead>
          <TableHead>Comment</TableHead>
          <TableHead>Page</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comments.map((comment) => (
          <TableRow key={comment.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarImage
                    src={comment.commenter.image ?? undefined}
                    alt={comment.commenter.name}
                  />
                  <AvatarFallback>
                    {comment.commenter.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">
                  {comment.commenter.name}
                </span>
              </div>
            </TableCell>
            <TableCell className="max-w-md truncate text-sm text-muted-foreground">
              {comment.body}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {comment.page.slug}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[comment.status]}>
                {comment.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {comment.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
