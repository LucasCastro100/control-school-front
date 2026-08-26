import type { AuthUser } from "../types"
import { hashPassword } from "@/lib/auth/crypto"

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

    const { createClient } = await import("@/utils/supabase/client")
    const supabase = createClient()
    const hashed = await hashPassword(password)

    const { error } = await supabase
      .from("users")
      .update({ password: hashed })
      .eq("id", user.userId)

    return { error: error?.message ?? null }
  } catch {
    return { error: "Erro ao atualizar senha" }
  }
}

export async function updateProfile(data: { name: string }): Promise<{ error: string | null }> {
  try {
    const res = await fetch("/api/auth/session")
    if (!res.ok) return { error: "Não autenticado" }
    const { user } = await res.json()

    const { createClient } = await import("@/utils/supabase/client")
    const supabase = createClient()

    const { error } = await supabase
      .from("users")
      .update({ name: data.name })
      .eq("id", user.userId)

    return { error: error?.message ?? null }
  } catch {
    return { error: "Erro ao atualizar perfil" }
  }
}
