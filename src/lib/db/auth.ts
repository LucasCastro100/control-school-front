import type { AuthUser } from "../types"
import { createClient } from "@/utils/supabase/client"

export type LoginError = "invalid" | "email_not_confirmed" | null

export async function login(email: string, password: string): Promise<{ user: AuthUser | null; error: LoginError }> {
  const supabase = createClient()

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
  const role = meta?.role ?? "admin"
  let userId = meta?.user_id

  // Auto-criar registro na tabela users se não existir
  if (!userId) {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      userId = existingUser.id
    } else {
      userId = crypto.randomUUID()
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        name: meta?.name ?? data.user.email?.split("@")[0] ?? "",
        email: data.user.email ?? "",
        password: "",
        role,
        created_at: new Date().toISOString(),
      })
      if (!insertError) {
        await supabase.auth.updateUser({
          data: { user_id: userId },
        })
      }
    }
  }

  return {
    user: {
      email: data.user.email ?? "",
      name: meta?.name ?? "",
      role,
      userId,
      schoolId: meta?.school_id,
    },
    error: null,
  }
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

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { error: error?.message ?? null }
}

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password })
  return { error: error?.message ?? null }
}

export async function updateProfile(data: { name: string }): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ data: { name: data.name } })
  if (error) return { error: error.message }

  const { data: { user } } = await supabase.auth.getUser()
  if (user?.user_metadata?.user_id) {
    const { error: dbError } = await supabase
      .from("users")
      .update({ name: data.name })
      .eq("id", user.user_metadata.user_id)
    if (dbError) return { error: dbError.message }
  }

  return { error: null }
}
