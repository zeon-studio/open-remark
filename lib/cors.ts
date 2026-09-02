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

export function normalizeOrigin(input: string): string {
  try {
    const raw = input.trim()
    if (raw === "*") return "*"
    const withProto = raw.match(/^https?:\/\//i) ? raw : `https://${raw}`
    return new URL(withProto).origin.toLowerCase()
  } catch {
    return input.trim().toLowerCase().replace(/\/+$/, "")
  }
}

export function isOriginAllowed(
  origin: string | null,
  allowedOriginsJson: string,
  siteDomain?: string | null
): boolean {
  if (!origin) return false

  const normalizedOrigin = normalizeOrigin(origin)

  // Allow localhost / local loopback in development mode
  if (
    process.env.NODE_ENV !== "production" &&
    (normalizedOrigin.startsWith("http://localhost:") ||
      normalizedOrigin.startsWith("http://127.0.0.1:") ||
      normalizedOrigin.startsWith("http://[::1]:") ||
      normalizedOrigin === "http://localhost" ||
      normalizedOrigin === "http://127.0.0.1")
  ) {
    return true
  }

  // Check against site's registered domain if provided
  if (siteDomain && normalizeOrigin(siteDomain) === normalizedOrigin) {
    return true
  }

  try {
    const allowed: string[] = JSON.parse(allowedOriginsJson)
    // No restrictions configured — allow all origins (useful for development
    // and for sites that haven't set up origin allow-listing yet).
    if (allowed.length === 0) return true

    return allowed.some((raw) => {
      const o = raw.trim()
      if (o === "*") return true
      const normalizedEntry = normalizeOrigin(o)
      if (normalizedEntry === normalizedOrigin) return true

      // Handle wildcard patterns (e.g. https://*.github.io, *.domain.com)
      if (o.includes("*")) {
        const patternStr = o.match(/^https?:\/\//i)
          ? o
          : `https?://${o.replace(/^\*\./, "([^.]+\\.)*")}`
        const pattern = new RegExp(
          "^" +
            patternStr
              .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
              .replace(/\\\*/g, ".*") +
            "/?.*$",
          "i"
        )
        return pattern.test(origin) || pattern.test(normalizedOrigin)
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
