import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { QueryProvider } from "@/components/dashboard/query-provider"
import { getSiteCountForUser } from "@/lib/services/site-service"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const siteCount = await getSiteCountForUser(session.user.id)

  return (
    <QueryProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar
            user={session.user}
            siteCount={siteCount}
            platformRole={session.user.platformRole}
          />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </QueryProvider>
  )
}
