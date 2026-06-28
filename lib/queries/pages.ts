import { useMutation } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"

export function useDeletePage(siteId: string) {
  return useMutation({
    mutationFn: (pageId: string) =>
      apiFetch<void>(`/api/v1/sites/${siteId}/pages/${pageId}`, {
        method: "DELETE",
      }),
    // Caller shows its own toast message.
    meta: { silent: true },
  })
}
