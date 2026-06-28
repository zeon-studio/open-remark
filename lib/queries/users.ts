import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import type { ClientCommentStatus } from "@/lib/queries/comments"
import type { CommenterProfile } from "@/lib/types/commenter"

// Mirrors lib/queries/comments.ts's commentListKey/useCommentList pattern:
// the commenters list is server-rendered (paginated/searched by the Server
// Component), so this cache entry is a mutation anchor seeded by initialData,
// not something queryFn ever refetches.
export function commenterListKey(key: string) {
  return ["commenters", "list", key] as const
}

export function useCommenterList<T extends { id: string }>(
  key: string,
  initialData: T[]
) {
  return useQuery({
    queryKey: commenterListKey(key),
    queryFn: () => Promise.resolve(initialData),
    initialData,
    staleTime: Infinity,
  })
}

export type CommenterComment = {
  id: string
  body: string
  status: ClientCommentStatus
  createdAt: string
  editedAt?: string | null
  page: { slug: string; url: string | null }
  commenter: CommenterProfile
}

export const userKeys = {
  comments: (siteId: string, commenterId: string) =>
    ["users", siteId, commenterId, "comments"] as const,
}

export function useCommenterComments(
  siteId: string,
  commenterId: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: userKeys.comments(siteId, commenterId ?? ""),
    queryFn: () =>
      apiFetch<CommenterComment[]>(
        `/api/v1/sites/${siteId}/users/${commenterId}/comments`
      ),
    enabled: enabled && !!commenterId,
  })
}

function banAction(
  siteId: string,
  commenterId: string,
  action: "ban" | "unban" | "deleteAll"
) {
  return apiFetch<unknown>(`/api/v1/sites/${siteId}/users/${commenterId}/ban`, {
    method: "POST",
    body: JSON.stringify({ action }),
  })
}

function useOptimisticCommenterPatch<T extends { id: string }>(
  listKey: string,
  patch: (c: T) => Partial<T>
) {
  const qc = useQueryClient()
  const queryKey = commenterListKey(listKey)
  return {
    onMutate: (commenterId: string) => {
      const previous = qc.getQueryData<T[]>(queryKey)
      qc.setQueryData<T[]>(queryKey, (old) =>
        old?.map((c) => (c.id === commenterId ? { ...c, ...patch(c) } : c))
      )
      return { previous }
    },
    onError: (_err: unknown, _vars: string, ctx?: { previous?: T[] }) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous)
    },
  }
}

export function useBanCommenter<T extends { id: string; isBanned: boolean }>(
  siteId: string,
  listKey: string
) {
  return useMutation({
    mutationFn: (commenterId: string) => banAction(siteId, commenterId, "ban"),
    ...useOptimisticCommenterPatch<T>(
      listKey,
      () => ({ isBanned: true }) as Partial<T>
    ),
    meta: { silent: true },
  })
}

export function useUnbanCommenter<T extends { id: string; isBanned: boolean }>(
  siteId: string,
  listKey: string
) {
  return useMutation({
    mutationFn: (commenterId: string) =>
      banAction(siteId, commenterId, "unban"),
    ...useOptimisticCommenterPatch<T>(
      listKey,
      () => ({ isBanned: false }) as Partial<T>
    ),
    meta: { silent: true },
  })
}

export function useDeleteAllCommentsByCommenter<
  T extends {
    id: string
    totalCount: number
    spamCount: number
    deletedCount: number
  },
>(siteId: string, listKey: string) {
  return useMutation({
    mutationFn: (commenterId: string) =>
      banAction(siteId, commenterId, "deleteAll"),
    ...useOptimisticCommenterPatch<T>(
      listKey,
      (c) => ({ deletedCount: c.totalCount - c.spamCount }) as Partial<T>
    ),
    meta: { silent: true },
  })
}

export function useToggleCommenterNotifications<
  T extends { id: string; notificationsEnabled: boolean },
>(siteId: string, listKey: string) {
  const qc = useQueryClient()
  const queryKey = commenterListKey(listKey)
  return useMutation({
    mutationFn: ({
      commenterId,
      notificationsEnabled,
    }: {
      commenterId: string
      notificationsEnabled: boolean
    }) =>
      apiFetch<{ notificationsEnabled: boolean }>(
        `/api/v1/sites/${siteId}/users/${commenterId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ notificationsEnabled }),
        }
      ),
    onMutate: ({ commenterId, notificationsEnabled }) => {
      const previous = qc.getQueryData<T[]>(queryKey)
      qc.setQueryData<T[]>(queryKey, (old) =>
        old?.map((c) =>
          c.id === commenterId ? { ...c, notificationsEnabled } : c
        )
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous)
    },
    meta: { silent: true },
  })
}
