import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { UpdateCommentSchema } from "@/lib/validators/comment"
import {
  updateCommentBody,
  deleteComment,
} from "@/lib/services/comment-service"
import { isCommenterBannedOnSite } from "@/lib/services/user-service"
import { verifyWidgetToken } from "@/lib/auth-widget"
import { corsHeaders } from "@/lib/cors"
import { db } from "@/lib/db"
import { ApiError, handleApiError } from "@/lib/api/error"

function buildCorsResponse(req: NextRequest, body: unknown, status = 200) {
  const origin = req.headers.get("origin") ?? ""
  return NextResponse.json(body, {
    status,
    headers: corsHeaders(origin),
  })
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? ""
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError("Unauthorized", 401)
    }
    const token = authHeader.slice(7)
    const payload = await verifyWidgetToken(token)
    if (!payload) throw new ApiError("Invalid token", 401)

    const body = await req.json()
    const parsed = UpdateCommentSchema.safeParse(body)
    if (!parsed.success) {
      return buildCorsResponse(
        req,
        { error: z.flattenError(parsed.error) },
        422
      )
    }

    // Verify ownership
    const comment = await db.comment.findUnique({
      where: { id },
      select: { commenterId: true, page: { select: { siteId: true } } },
    })
    if (!comment) throw new ApiError("Comment not found", 404)
    if (comment.commenterId !== payload.commenterId) {
      throw new ApiError("Forbidden", 403)
    }

    const isBanned = await isCommenterBannedOnSite(
      comment.page.siteId,
      payload.commenterId
    )
    if (isBanned) {
      throw new ApiError("Your account has been suspended on this site", 403)
    }

    if (parsed.data.body !== undefined) {
      const updated = await updateCommentBody(id, parsed.data.body)
      return buildCorsResponse(req, updated)
    }

    if (parsed.data.status !== undefined) {
      const updated = await deleteComment(id)
      return buildCorsResponse(req, updated)
    }

    throw new ApiError("Invalid update", 400)
  } catch (err) {
    return handleApiError(err, req.headers.get("origin") ?? undefined)
  }
}
