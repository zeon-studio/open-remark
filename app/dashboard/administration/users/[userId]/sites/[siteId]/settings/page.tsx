// app/dashboard/administration/users/[userId]/sites/[siteId]/settings/page.tsx
import { notFound } from "next/navigation"
import { getSiteForAdminView } from "@/lib/services/platform-admin-service"
import { ReadOnlySiteSettings } from "@/components/dashboard/administration/read-only-site-settings"

type Props = { params: Promise<{ siteId: string }> }

export default async function AdminSiteSettingsPage({ params }: Props) {
  const { siteId } = await params

  let site
  try {
    site = await getSiteForAdminView(siteId)
  } catch {
    notFound()
  }

  return <ReadOnlySiteSettings site={site} />
}
