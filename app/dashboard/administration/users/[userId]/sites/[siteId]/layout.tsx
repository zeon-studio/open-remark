// app/dashboard/administration/users/[userId]/sites/[siteId]/layout.tsx
import { notFound } from "next/navigation"
import { getSiteForAdminView } from "@/lib/services/platform-admin-service"
import { AdminSiteSubNav } from "@/components/dashboard/administration/admin-site-sub-nav"

type Props = {
  children: React.ReactNode
  params: Promise<{ userId: string; siteId: string }>
}

export default async function AdminSiteLayout({ children, params }: Props) {
  const { userId, siteId } = await params

  let site
  try {
    site = await getSiteForAdminView(siteId)
  } catch {
    notFound()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminSiteSubNav
        userId={userId}
        siteId={siteId}
        siteName={site.name}
        siteDomain={site.domain}
      />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
