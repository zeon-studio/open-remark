import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"

export type ClientCommentStatus = "APPROVED" | "PENDING" | "SPAM" | "DELETED"

// The comments list itself is server-rendered (paginated/filtered by the
// Server Component) — there's no client GET-all endpoint. We mirror the
// server props into the query cache under a key scoped to this render so
// mutations can use normal React Query optimistic updates (onMutate +
// rollback) instead of a bespoke local-state hook. The caller's parent
// Suspense boundary remounts CommentsTable on filter/page changes (see
// `suspenseKey` in the comments page), which naturally resets this cache
// entry — no manual re-sync needed.
export function commentListKey(key: string) {
  return ["comments", "list", key] as const
}

export function useCommentList<T extends { id: string }>(
  key: string,
  initialData: T[]
) {
  return useQuery({
    queryKey: commentListKey(key),
    queryFn: () => Promise.resolve(initialData),
    initialData,
    staleTime: Infinity,
  })
}

type WithIdAndStatus = { id: string; status: ClientCommentStatus }

export function useUpdateCommentStatus<T extends WithIdAndStatus>(
  listKey: string
) {
  const qc = useQueryClient()
  const queryKey = commentListKey(listKey)
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClientCommentStatus }) =>
      apiFetch<void>(`/api/v1/comments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onMutate: ({ id, status }) => {
      const previous = qc.getQueryData<T[]>(queryKey)
      qc.setQueryData<T[]>(queryKey, (old) =>
        old?.map((c) => (c.id === id ? { ...c, status } : c))
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous)
    },
    meta: { silent: true },
  })
}

export function useBulkUpdateCommentStatus<T extends WithIdAndStatus>(
  listKey: string
) {
  const qc = useQueryClient()
  const queryKey = commentListKey(listKey)
  return useMutation({
    mutationFn: ({
      ids,
      status,
    }: {
      ids: string[]
      status: ClientCommentStatus
    }) =>
      apiFetch<void>(`/api/v1/comments`, {
        method: "PATCH",
        body: JSON.stringify({ ids, status }),
      }),
    onMutate: ({ ids, status }) => {
      const previous = qc.getQueryData<T[]>(queryKey)
      const idSet = new Set(ids)
      qc.setQueryData<T[]>(queryKey, (old) =>
        old?.map((c) => (idSet.has(c.id) ? { ...c, status } : c))
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous)
    },
    meta: { silent: true },
  })
}

export function useUpdateCommentBody<T extends { id: string }>(
  listKey: string
) {
  const qc = useQueryClient()
  const queryKey = commentListKey(listKey)
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      apiFetch<void>(`/api/v1/comments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      }),
    onMutate: ({ id, body }) => {
      const previous = qc.getQueryData<T[]>(queryKey)
      qc.setQueryData<T[]>(queryKey, (old) =>
        old?.map((c) =>
          c.id === id ? { ...c, body, editedAt: new Date() } : c
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
