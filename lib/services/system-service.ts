import { db } from "@/lib/db"

export interface SystemHealth {
  status: "ok" | "error"
  database: "connected" | "disconnected"
  latencyMs: number
  timestamp: string
}

/**
 * Pings the database to verify connectivity and keep serverless/Supabase connections alive.
 */
export async function pingDatabase(): Promise<SystemHealth> {
  const start = Date.now()
  await db.$queryRaw`SELECT 1`
  const latencyMs = Date.now() - start

  return {
    status: "ok",
    database: "connected",
    latencyMs,
    timestamp: new Date().toISOString(),
  }
}
