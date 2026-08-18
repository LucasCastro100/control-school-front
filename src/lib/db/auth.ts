import type { AuthUser } from "../types"
import { supabase } from "../supabase"

const AUTH_KEY = "control-schools:auth"

export async function login(email: string, password: string): Promise<AuthUser | null> {
  if (email === "admin@gmail.com" && password === "mudar123") {
    const user: AuthUser = { email, name: "Administrador", role: "admin" }
    if (typeof window !== "undefined") localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    return user
  }
  const { data: users } = await supabase.from("users").select("*")
  const found = users?.find(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase() && u.password === password
  )
  if (found) {
    const user: AuthUser = {
      email: found.email,
      name: found.name,
      role: found.role,
      userId: found.id,
    }
    if (typeof window !== "undefined") localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    return user
  }
  const { data: schools } = await supabase.from("schools").select("*")
  const school = schools?.find(
    (s) => s.email?.toLowerCase() === email.trim().toLowerCase() && s.password === password
  )
  if (school) {
    const user: AuthUser = { email: school.email, name: school.name, role: "escola", schoolId: school.id }
    if (typeof window !== "undefined") localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    return user
  }
  return null
}

export function logout(): void {
  if (typeof window !== "undefined") localStorage.removeItem(AUTH_KEY)
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(AUTH_KEY)
    return data ? (JSON.parse(data) as AuthUser) : null
  } catch { return null }
}
