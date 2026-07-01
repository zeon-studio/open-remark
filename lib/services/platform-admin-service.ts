// lib/services/platform-admin-service.ts
import { db } from "@/lib/db"
import { ApiError } from "@/lib/api/error"
import { getSitesForUser } from "@/lib/services/site-service"
import type { PlatformRole } from "@/generated/prisma/client"

export type PlatformUserRow = {
  id: string
  name: string | null
  email: string
  image: string | null
  platformRole: PlatformRole
  createdAt: Date
  siteCount: number
}

export async function listPlatformUsers(
  params: { search?: string } = {}
): Promise<PlatformUserRow[]> {
  const { search } = params

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined

  const users = await db.user.findMany({
    where,
    include: {
      _count: { select: { memberships: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    platformRole: u.platformRole,
    createdAt: u.createdAt,
    siteCount: u._count.memberships,
  }))
}

export async function getPlatformUserProfile(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError("User not found", 404)

  const sites = await getSitesForUser(userId)

  return { user, sites }
}

/**
 * Fetch a site with no membership check — the platform owner is never a
 * member of the sites they're inspecting. Read-only oversight only; never
 * used to authorize a mutation.
 */
export async function getSiteForAdminView(siteId: string) {
  const site = await db.site.findUnique({ where: { id: siteId } })
  if (!site) throw new ApiError("Site not found", 404)
  return site
}
