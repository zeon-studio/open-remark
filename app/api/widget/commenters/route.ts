import { NextRequest, NextResponse } from "next/server"
import { getSiteBySiteKey } from "@/lib/services/site-service"
import { searchCommentersByUsername } from "@/lib/services/user-service"
import { handleApiError, ApiError } from "@/lib/api/error"
import { corsHeaders } from "@/lib/cors"

function buildCorsResponse(req: NextRequest, body: unknown) {
  const origin = req.headers.get("origin") ?? ""
  return NextResponse.json(body, { headers: corsHeaders(origin) })
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? ""
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const siteKey = searchParams.get("siteKey")
    const q = searchParams.get("q")?.trim() ?? ""

    if (!siteKey) throw new ApiError("siteKey required", 400)
    if (!q) return buildCorsResponse(req, { commenters: [] })

    const site = await getSiteBySiteKey(siteKey)
    const commenters = await searchCommentersByUsername(site.id, q, 3)

    return buildCorsResponse(req, { commenters })
  } catch (err) {
    return handleApiError(err, req.headers.get("origin") ?? undefined)
  }
}
