import type { User } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId, toCamel, toSnake } from "./helpers"

export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false })
  return (data ?? []).map(toCamel<User>)
}

export async function getUsersByRole(role: User["role"]): Promise<User[]> {
  const { data } = await supabase.from("users").select("*").eq("role", role)
  return (data ?? []).map(toCamel<User>)
}

export async function getUser(id: string): Promise<User | undefined> {
  const { data } = await supabase.from("users").select("*").eq("id", id).single()
  return data ? toCamel<User>(data) : undefined
}

export async function createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
  const row = { ...toSnake(data as Record<string, unknown>), password: data.password || "mudar123", id: generateId(), created_at: new Date().toISOString() }
  const { error } = await supabase.from("users").insert(row)
  if (error) throw error
  return toCamel<User>(row)
}

export async function updateUser(id: string, data: Partial<Omit<User, "id" | "createdAt">>): Promise<User | undefined> {
  const snakeData = toSnake(data as Record<string, unknown>)
  const { data: updated } = await supabase.from("users").update(snakeData).eq("id", id).select().single()
  return updated ? toCamel<User>(updated) : undefined
}

export async function deleteUser(id: string): Promise<void> {
  await supabase.from("users").delete().eq("id", id)
}

// ===== USER_SCHOOLS (pivot) =====
export async function getSchoolsByUser(userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_schools").select("school_id").eq("user_id", userId)
  return (data ?? []).map((r) => r.school_id)
}

export async function getUsersBySchool(schoolId: string): Promise<string[]> {
  const { data } = await supabase.from("user_schools").select("user_id").eq("school_id", schoolId)
  return (data ?? []).map((r) => r.user_id)
}

export async function addUserSchool(userId: string, schoolId: string): Promise<void> {
  const { error } = await supabase.from("user_schools").insert({ user_id: userId, school_id: schoolId })
  if (error) throw error
}

export async function removeUserSchool(userId: string, schoolId: string): Promise<void> {
  await supabase.from("user_schools").delete().eq("user_id", userId).eq("school_id", schoolId)
}

export async function replaceUserSchools(userId: string, schoolIds: string[]): Promise<void> {
  await supabase.from("user_schools").delete().eq("user_id", userId)
  const rows = schoolIds.map((sid) => ({ user_id: userId, school_id: sid }))
  if (rows.length > 0) await supabase.from("user_schools").insert(rows)
}
