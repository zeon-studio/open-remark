// app/dashboard/administration/users/[userId]/sites/[siteId]/users/page.tsx
import { notFound } from "next/navigation"
import { getSiteForAdminView } from "@/lib/services/platform-admin-service"
import { getCommentersBySite } from "@/lib/services/user-service"
import { ReadOnlyCommentersList } from "@/components/dashboard/administration/read-only-commenters-list"

type Props = { params: Promise<{ siteId: string }> }

export default async function AdminSiteUsersPage({ params }: Props) {
  const { siteId } = await params

  try {
    await getSiteForAdminView(siteId)
  } catch {
    notFound()
  }

  const { commenters, total } = await getCommentersBySite(siteId)

  return (
    <div className="p-6">
      <div className="mb-3 text-sm text-muted-foreground tabular-nums">
        {total} {total === 1 ? "user" : "users"}
      </div>
      <ReadOnlyCommentersList commenters={commenters} />
    </div>
  )
}
