export class BackendError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "BackendError"
    this.status = status
  }
}

interface ApiOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? "GET"

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  const url = `/api/backend/${path}${qs ? `?${qs}` : ""}`

  const res = await fetch(url, {
    method,
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const data = await res.json()
      if (typeof data?.message === "string") message = data.message
      const errors = data?.errors
      if (errors) message = Object.values(errors).flat().join(" ")
    } catch {
      // corpo não-JSON
    }
    throw new BackendError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function apiOrUndefined<T>(path: string): Promise<T | undefined> {
  try {
    return await api<T>(path)
  } catch {
    return undefined
  }
}