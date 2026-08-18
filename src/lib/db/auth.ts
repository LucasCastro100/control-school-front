import type { AuthUser } from "../types"
import { createClient } from "@/utils/supabase/client"

export type LoginError = "invalid" | "email_not_confirmed" | null

export async function login(email: string, password: string): Promise<{ user: AuthUser | null; error: LoginError }> {
  const supabase = createClient()

  // Login direto via Supabase Auth
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    if (signInError.message?.includes("Email not confirmed")) {
      return { user: null, error: "email_not_confirmed" }
    }
    return { user: null, error: "invalid" }
  }

  if (!data.user) return { user: null, error: "invalid" }

  const meta = data.user.user_metadata

  // Se é admin (cadastrado direto no Supabase Auth)
  if (meta?.role === "admin") {
    return {
      user: {
        email: data.user.email ?? "",
        name: meta.name ?? "Admin",
        role: "admin",
      },
      error: null,
    }
  }

  // Buscar na tabela users (orientador/professor)
  const { data: users } = await supabase.from("users").select("*")
  const found = users?.find(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
  )
  if (found) {
    return {
      user: {
        email: found.email,
        name: found.name,
        role: found.role,
        userId: found.id,
      },
      error: null,
    }
  }

  // Buscar na tabela schools
  const { data: schools } = await supabase.from("schools").select("*")
  const school = schools?.find(
    (s) => s.email?.toLowerCase() === email.trim().toLowerCase()
  )
  if (school) {
    return {
      user: {
        email: school.email,
        name: school.name,
        role: "escola",
        schoolId: school.id,
      },
      error: null,
    }
  }

  return { user: null, error: "invalid" }
}

export async function logout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function getSession(): Promise<AuthUser | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const meta = session.user.user_metadata
  return {
    email: session.user.email ?? "",
    name: meta?.name ?? "",
    role: meta?.role ?? "admin",
    userId: meta?.user_id,
    schoolId: meta?.school_id,
  }
}
