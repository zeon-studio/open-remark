// app/dashboard/administration/users/[userId]/sites/[siteId]/page.tsx
import { notFound } from "next/navigation"
import { getSiteForAdminView } from "@/lib/services/platform-admin-service"
import { getSiteCommentStats } from "@/lib/services/moderation-service"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  RiMessage2Line,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAlertLine,
} from "@remixicon/react"

type Props = { params: Promise<{ siteId: string }> }

export default async function AdminSiteOverviewPage({ params }: Props) {
  const { siteId } = await params

  try {
    await getSiteForAdminView(siteId)
  } catch {
    notFound()
  }

  const stats = await getSiteCommentStats(siteId)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Comments"
          value={stats.total}
          icon={RiMessage2Line}
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={RiTimeLine}
          variant="warning"
          description={stats.pending > 0 ? "Needs attention" : "All clear"}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={RiCheckboxCircleLine}
          variant="success"
        />
        <StatCard
          title="Spam"
          value={stats.spam}
          icon={RiAlertLine}
          variant="destructive"
        />
      </div>
    </div>
  )
}
