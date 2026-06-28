import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import type { SiteRole, GrantableSiteRole } from "@/lib/permissions"

export type Member = {
  userId: string
  role: SiteRole
  name: string | null
  email: string | null
  image: string | null
}

export type Invite = { id: string; email: string; role: SiteRole }

export type Team = { members: Member[]; invites: Invite[] }

export const teamKeys = {
  detail: (siteId: string) => ["team", siteId] as const,
}

// GET /api/v1/sites/:siteId/members returns raw SiteMember rows with a
// nested `user` relation, not the flat Member shape the UI uses — flatten
// it here so a background refetch doesn't blow away the server-rendered
// names/emails/avatars with `undefined`.
type MemberRow = {
  userId: string
  role: SiteRole
  user: { name: string | null; email: string | null; image: string | null }
}

export function useTeam(siteId: string, initialData: Team) {
  return useQuery({
    queryKey: teamKeys.detail(siteId),
    queryFn: async () => {
      const [rows, invites] = await Promise.all([
        apiFetch<MemberRow[]>(`/api/v1/sites/${siteId}/members`),
        apiFetch<Invite[]>(`/api/v1/sites/${siteId}/invites`),
      ])
      const members: Member[] = rows.map((r) => ({
        userId: r.userId,
        role: r.role,
        name: r.user.name,
        email: r.user.email,
        image: r.user.image,
      }))
      return { members, invites }
    },
    initialData,
  })
}

export function useInviteMember(siteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { email: string; role: GrantableSiteRole }) =>
      apiFetch<Invite>(`/api/v1/sites/${siteId}/invites`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (invite) => {
      qc.setQueryData<Team>(teamKeys.detail(siteId), (old) =>
        old ? { ...old, invites: [...old.invites, invite] } : old
      )
    },
    // Callers render their own inline error message.
    meta: { silent: true },
  })
}

export function useRemoveMember(siteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<void>(`/api/v1/sites/${siteId}/members`, {
        method: "DELETE",
        body: JSON.stringify({ userId }),
      }),
    onSuccess: (_data, userId) => {
      qc.setQueryData<Team>(teamKeys.detail(siteId), (old) =>
        old
          ? { ...old, members: old.members.filter((m) => m.userId !== userId) }
          : old
      )
    },
    meta: { silent: true },
  })
}

export function useRevokeInvite(siteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) =>
      apiFetch<void>(`/api/v1/sites/${siteId}/invites`, {
        method: "DELETE",
        body: JSON.stringify({ inviteId }),
      }),
    onSuccess: (_data, inviteId) => {
      qc.setQueryData<Team>(teamKeys.detail(siteId), (old) =>
        old
          ? { ...old, invites: old.invites.filter((i) => i.id !== inviteId) }
          : old
      )
    },
    meta: { silent: true },
  })
}
