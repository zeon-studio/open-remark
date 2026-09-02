export function getEffectiveOrigin(req: Request): string | null {
  const origin = req.headers.get("origin")
  if (origin) return origin
  const referer = req.headers.get("referer")
  if (referer) {
    try {
      return new URL(referer).origin
    } catch {
      return null
    }
  }
  return null
}

export function isOriginAllowed(
  origin: string | null,
  allowedOriginsJson: string
): boolean {
  if (!origin) return false

  // Allow localhost / local loopback in development mode
  if (
    process.env.NODE_ENV !== "production" &&
    (origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.startsWith("http://[::1]:"))
  ) {
    return true
  }

  try {
    const allowed: string[] = JSON.parse(allowedOriginsJson)
    // No restrictions configured — allow all origins (useful for development
    // and for sites that haven't set up origin allow-listing yet).
    if (allowed.length === 0) return true
    return allowed.some((o) => {
      if (o === "*" || o === origin) return true
      if (o.includes("*")) {
        const pattern = new RegExp(
          "^" +
            o.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*") +
            "$"
        )
        return pattern.test(origin)
      }
      return false
    })
  } catch {
    return false
  }
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}
