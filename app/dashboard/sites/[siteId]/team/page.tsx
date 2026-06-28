import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import {
  requireSiteAccess,
  listMembers,
  listPendingInvites,
} from "@/lib/services/membership-service"
import { GRANTABLE_SITE_ROLES } from "@/lib/permissions"
import { TeamManager } from "@/components/dashboard/team/team-manager"

type Props = { params: Promise<{ siteId: string }> }

export default async function TeamPage({ params }: Props) {
  const { siteId } = await params
  const session = await auth()

  let role
  try {
    const res = await requireSiteAccess(
      siteId,
      session!.user!.id,
      "MANAGE_MODERATORS"
    )
    role = res.membership.role
  } catch {
    notFound()
  }

  const [members, invites] = await Promise.all([
    listMembers(siteId),
    listPendingInvites(siteId),
  ])

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <TeamManager
        siteId={siteId}
        currentUserId={session!.user!.id}
        myRole={role!}
        grantableRoles={[...GRANTABLE_SITE_ROLES[role!]]}
        initialTeam={{
          members: members.map((m) => ({
            userId: m.userId,
            role: m.role,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
          })),
          invites: invites.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
          })),
        }}
      />
    </div>
  )
}
