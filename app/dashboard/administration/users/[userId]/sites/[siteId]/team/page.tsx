// app/dashboard/administration/users/[userId]/sites/[siteId]/team/page.tsx
import { notFound } from "next/navigation"
import { getSiteForAdminView } from "@/lib/services/platform-admin-service"
import { listMembers } from "@/lib/services/membership-service"
import { ReadOnlyTeamList } from "@/components/dashboard/administration/read-only-team-list"

type Props = { params: Promise<{ siteId: string }> }

export default async function AdminSiteTeamPage({ params }: Props) {
  const { siteId } = await params

  try {
    await getSiteForAdminView(siteId)
  } catch {
    notFound()
  }

  const members = await listMembers(siteId)

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <ReadOnlyTeamList members={members} />
    </div>
  )
}
