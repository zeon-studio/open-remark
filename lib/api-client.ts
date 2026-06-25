export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message =
      typeof body.error === "string" ? body.error : "Request failed"
    throw new ApiClientError(message, res.status, body.error)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}
