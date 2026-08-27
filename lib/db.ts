import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL
  const isLocal =
    !rawUrl || rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1")

  // For remote managed databases (Supabase, Neon, AWS RDS), remove conflicting sslmode query params
  // so pg uses explicit SSL options with rejectUnauthorized: false.
  const connectionString = isLocal || !rawUrl ? rawUrl : rawUrl.split("?")[0]

  const adapter = new PrismaPg({
    connectionString,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  })

  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
