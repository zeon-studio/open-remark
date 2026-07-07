// components/dashboard/administration/platform-users-table.tsx
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { PlatformUserRow } from "@/lib/services/platform-admin-service"

type Props = { users: PlatformUserRow[] }

export function PlatformUsersTable({ users }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Sites</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user, index) => (
          <TableRow key={user.id}>
            <TableCell className="text-sm text-muted-foreground tabular-nums">
              {index + 1}
            </TableCell>
            <TableCell>
              <Link
                href={`/dashboard/administration/users/${user.id}`}
                className="flex items-center gap-3"
              >
                <Avatar size="sm">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? user.email}
                  />
                  <AvatarFallback>
                    {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user.name ?? "Unnamed"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  user.platformRole === "PLATFORM_OWNER" ? "default" : "outline"
                }
              >
                {user.platformRole === "PLATFORM_OWNER" ? "Owner" : "User"}
              </Badge>
            </TableCell>
            <TableCell className="tabular-nums">{user.siteCount}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {user.createdAt.toLocaleDateString("en-US", {
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
