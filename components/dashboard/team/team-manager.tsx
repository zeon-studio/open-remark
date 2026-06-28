"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { SiteRole, GrantableSiteRole } from "@/lib/permissions"
import { ApiClientError } from "@/lib/api-client"
import {
  useTeam,
  useInviteMember,
  useRemoveMember,
  useRevokeInvite,
  type Team,
} from "@/lib/queries/team"

type Props = {
  siteId: string
  currentUserId: string
  myRole: SiteRole
  grantableRoles: GrantableSiteRole[]
  initialTeam: Team
}

const ROLE_LABEL: Record<SiteRole, string> = {
  SITE_OWNER: "Owner",
  SITE_ADMIN: "Admin",
  SITE_MODERATOR: "Moderator",
}

export function TeamManager({
  siteId,
  currentUserId,
  grantableRoles,
  initialTeam,
}: Props) {
  const { data } = useTeam(siteId, initialTeam)
  const { members, invites } = data
  const inviteMember = useInviteMember(siteId)
  const removeMember = useRemoveMember(siteId)
  const revokeInvite = useRevokeInvite(siteId)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<GrantableSiteRole>(
    grantableRoles[0] ?? "SITE_MODERATOR"
  )
  const [error, setError] = useState<string | null>(null)

  const busy =
    inviteMember.isPending || removeMember.isPending || revokeInvite.isPending

  function errorMessage(err: unknown) {
    return err instanceof ApiClientError ? err.message : "Request failed"
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage who can moderate and administer this site.
        </p>
      </div>

      {/* Invite form */}
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          if (!email) return
          setError(null)
          inviteMember.mutate(
            { email, role },
            {
              onSuccess: () => setEmail(""),
              onError: (err) => setError(errorMessage(err)),
            }
          )
        }}
      >
        <Input
          type="email"
          required
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Select
          value={role}
          onValueChange={(v) => setRole(v as GrantableSiteRole)}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {grantableRoles.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={busy}>
          Invite
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Members */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Members</h2>
        <ul className="divide-y rounded-md border">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 p-3">
              <Avatar className="size-8">
                <AvatarImage src={m.image ?? undefined} alt={m.name ?? ""} />
                <AvatarFallback>
                  {(m.name ?? m.email ?? "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name ?? m.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email}
                </p>
              </div>
              <Badge variant="secondary">{ROLE_LABEL[m.role]}</Badge>
              {m.role !== "SITE_OWNER" && m.userId !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setError(null)
                    removeMember.mutate(m.userId, {
                      onError: (err) => setError(errorMessage(err)),
                    })
                  }}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Pending invites */}
      {invites.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Pending invites
          </h2>
          <ul className="divide-y rounded-md border">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{i.email}</p>
                </div>
                <Badge variant="outline">{ROLE_LABEL[i.role]}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setError(null)
                    revokeInvite.mutate(i.id, {
                      onError: (err) => setError(errorMessage(err)),
                    })
                  }}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
