// components/dashboard/administration/read-only-team-list.tsx
import type { listMembers } from "@/lib/services/membership-service"
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
import type { SiteRole } from "@/lib/permissions"

type Members = Awaited<ReturnType<typeof listMembers>>

const ROLE_LABEL: Record<SiteRole, string> = {
  SITE_OWNER: "Owner",
  SITE_ADMIN: "Admin",
  SITE_MODERATOR: "Moderator",
}

export function ReadOnlyTeamList({ members }: { members: Members }) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        No team members yet.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.userId}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarImage
                    src={member.user.image ?? undefined}
                    alt={member.user.name ?? member.user.email}
                  />
                  <AvatarFallback>
                    {(member.user.name ?? member.user.email)
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.user.name ?? "Unnamed"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{ROLE_LABEL[member.role]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
