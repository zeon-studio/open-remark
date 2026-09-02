import { NextResponse } from "next/server"
import { corsHeaders } from "@/lib/cors"

export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number = 400
  ) {
    super(message)
  }
}

export function handleApiError(err: unknown, origin?: string): NextResponse {
  const headers = origin ? corsHeaders(origin) : undefined
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status, headers }
    )
  }
  console.error(err)
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500, headers }
  )
}
