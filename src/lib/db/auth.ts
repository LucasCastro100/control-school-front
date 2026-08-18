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
  return {
    user: {
      email: data.user.email ?? "",
      name: meta?.name ?? "",
      role: meta?.role ?? "admin",
      userId: meta?.user_id,
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
