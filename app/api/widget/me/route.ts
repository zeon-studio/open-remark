import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyWidgetToken } from "@/lib/auth-widget"
import { updateCommenterNotifications } from "@/lib/services/user-service"
import { handleApiError, ApiError } from "@/lib/api/error"
import { corsHeaders } from "@/lib/cors"

const PatchSchema = z.object({
  notificationsEnabled: z.boolean(),
})

function buildCorsResponse(req: NextRequest, body: unknown, status = 200) {
  const origin = req.headers.get("origin") ?? ""
  return NextResponse.json(body, { status, headers: corsHeaders(origin) })
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? ""
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer "))
      throw new ApiError("Unauthorized", 401)
    const payload = await verifyWidgetToken(authHeader.slice(7))
    if (!payload) throw new ApiError("Invalid token", 401)

    const body = await req.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return buildCorsResponse(
        req,
        { error: z.flattenError(parsed.error) },
        422
      )
    }

    await updateCommenterNotifications(
      payload.commenterId,
      parsed.data.notificationsEnabled
    )
    return buildCorsResponse(req, { ok: true })
  } catch (err) {
    return handleApiError(err, req.headers.get("origin") ?? undefined)
  }
}
