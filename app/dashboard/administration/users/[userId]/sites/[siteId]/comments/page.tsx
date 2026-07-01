// app/dashboard/administration/users/[userId]/sites/[siteId]/comments/page.tsx
import { notFound } from "next/navigation"
import { getSiteForAdminView } from "@/lib/services/platform-admin-service"
import { getCommentsBySite } from "@/lib/services/comment-service"
import { ReadOnlyCommentsList } from "@/components/dashboard/administration/read-only-comments-list"

type Props = { params: Promise<{ siteId: string }> }

export default async function AdminSiteCommentsPage({ params }: Props) {
  const { siteId } = await params

  try {
    await getSiteForAdminView(siteId)
  } catch {
    notFound()
  }

  const { comments, total } = await getCommentsBySite(siteId)

  return (
    <div className="p-6">
      <div className="mb-3 text-sm text-muted-foreground tabular-nums">
        {total} {total === 1 ? "comment" : "comments"}
      </div>
      <ReadOnlyCommentsList comments={comments} />
    </div>
  )
}
