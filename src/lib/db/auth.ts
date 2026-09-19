import type { AuthUser } from "../types"

export type LoginError = "invalid" | "email_not_confirmed" | null

export async function login(email: string, password: string): Promise<{ user: AuthUser | null; error: LoginError }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { user: null, error: "invalid" }
    }

    return { user: data.user as AuthUser, error: null }
  } catch {
    return { user: null, error: "invalid" }
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/session")
    if (!res.ok) return null
    const data = await res.json()
    return (data.user as AuthUser) ?? null
  } catch {
    return null
  }
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  return { error: "Funcionalidade desabilitada" }
}

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch("/api/auth/session")
    if (!res.ok) return { error: "Não autenticado" }
    const { user } = await res.json()

    const r = await fetch(`/api/backend/users/${user.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    return { error: r.ok ? null : "Erro ao atualizar senha" }
  } catch {
    return { error: "Erro ao atualizar senha" }
  }
}

export async function updateProfile(data: { name: string }): Promise<{ error: string | null }> {
  try {
    const res = await fetch("/api/auth/session")
    if (!res.ok) return { error: "Não autenticado" }
    const { user } = await res.json()

    const r = await fetch(`/api/backend/users/${user.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name }),
    })

    return { error: r.ok ? null : "Erro ao atualizar perfil" }
  } catch {
    return { error: "Erro ao atualizar perfil" }
  }
}