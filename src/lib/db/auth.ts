import type { AuthUser } from "../types"
import { createClient } from "@/utils/supabase/client"

export async function login(email: string, password: string): Promise<AuthUser | null> {
  if (email === "admin@gmail.com" && password === "mudar123") {
    const user: AuthUser = { email, name: "Administrador", role: "admin" }
    return user
  }

  const supabase = createClient()

  // Buscar na tabela users
  const { data: users } = await supabase.from("users").select("*")
  const found = users?.find(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase() && u.password === password
  )
  if (found) {
    // Criar sessão via Supabase Auth (email fake pra manter sessão)
    const fakeEmail = `auth-${found.id}@control-school.app`
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: found.password || "mudar123",
    })

    // Se não existe no Supabase Auth, criar
    if (signInError) {
      await supabase.auth.signUp({
        email: fakeEmail,
        password: found.password || "mudar123",
        options: { data: { role: found.role, user_id: found.id, name: found.name } },
      })
      await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: found.password || "mudar123",
      })
    }

    const user: AuthUser = {
      email: found.email,
      name: found.name,
      role: found.role,
      userId: found.id,
    }
    return user
  }

  // Buscar na tabela schools
  const { data: schools } = await supabase.from("schools").select("*")
  const school = schools?.find(
    (s) => s.email?.toLowerCase() === email.trim().toLowerCase() && s.password === password
  )
  if (school) {
    const fakeEmail = `school-${school.id}@control-school.app`
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: school.password || "mudar123",
    })

    if (signInError) {
      await supabase.auth.signUp({
        email: fakeEmail,
        password: school.password || "mudar123",
        options: { data: { role: "escola", school_id: school.id, name: school.name } },
      })
      await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: school.password || "mudar123",
      })
    }

    const user: AuthUser = { email: school.email, name: school.name, role: "escola", schoolId: school.id }
    return user
  }

  return null
}

export async function logout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export function getAuthUser(): AuthUser | null {
  // Agora o session é gerenciado pelo middleware via cookies
  // Esta função retorna null - use getSession() para dados reais
  return null
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
