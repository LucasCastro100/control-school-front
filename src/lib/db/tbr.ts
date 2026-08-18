import type { TbrCategory, TbrTeam } from "../types"
import { supabase } from "../supabase"
import { generateId, toCamel, toSnake } from "./helpers"

// ===== TBR CATEGORIES =====
export async function getTbrCategories(): Promise<TbrCategory[]> {
  const { data } = await supabase.from("tbr_categories").select("*")
  return (data ?? []).map(toCamel<TbrCategory>)
}

export async function getTbrCategory(id: string): Promise<TbrCategory | undefined> {
  const { data } = await supabase.from("tbr_categories").select("*").eq("id", id).single()
  return data ? toCamel<TbrCategory>(data) : undefined
}

export async function createTbrCategory(data: Omit<TbrCategory, "id" | "createdAt">): Promise<TbrCategory> {
  const row = { id: generateId(), name: data.name, created_at: new Date().toISOString() }
  const { error } = await supabase.from("tbr_categories").insert(row)
  if (error) throw error
  return toCamel<TbrCategory>(row)
}

export async function updateTbrCategory(id: string, data: Partial<Omit<TbrCategory, "id" | "createdAt">>): Promise<TbrCategory | undefined> {
  const { data: updated } = await supabase.from("tbr_categories").update({ name: data.name }).eq("id", id).select().single()
  return updated ? toCamel<TbrCategory>(updated) : undefined
}

export async function deleteTbrCategory(id: string): Promise<void> {
  await supabase.from("tbr_categories").delete().eq("id", id)
}

// ===== TBR TEAMS =====
export async function getAllTbrTeams(): Promise<TbrTeam[]> {
  const { data } = await supabase.from("tbr_teams").select("*")
  return (data ?? []).map(toCamel<TbrTeam>)
}

export async function getTbrTeamsBySchool(schoolId: string): Promise<TbrTeam[]> {
  const { data } = await supabase.from("tbr_teams").select("*").eq("school_id", schoolId)
  return (data ?? []).map(toCamel<TbrTeam>)
}

export async function getTbrTeamsByCategory(categoryId: string): Promise<TbrTeam[]> {
  const { data } = await supabase.from("tbr_teams").select("*").eq("category_id", categoryId)
  return (data ?? []).map(toCamel<TbrTeam>)
}

export async function createTbrTeam(data: Omit<TbrTeam, "id" | "createdAt">): Promise<TbrTeam> {
  const row = { ...toSnake(data as Record<string, unknown>), id: generateId(), created_at: new Date().toISOString() }
  const { error } = await supabase.from("tbr_teams").insert(row)
  if (error) throw error
  return toCamel<TbrTeam>(row)
}

export async function deleteTbrTeam(id: string): Promise<void> {
  await supabase.from("tbr_teams").delete().eq("id", id)
}

export async function deleteTbrTeamsBySchool(schoolId: string): Promise<void> {
  await supabase.from("tbr_teams").delete().eq("school_id", schoolId)
}

export async function replaceTbrTeamsForSchool(schoolId: string, teams: { categoryId: string; name: string }[]): Promise<void> {
  await supabase.from("tbr_teams").delete().eq("school_id", schoolId)
  const rows = teams.map((t) => ({ id: generateId(), school_id: schoolId, category_id: t.categoryId, name: t.name, created_at: new Date().toISOString() }))
  if (rows.length > 0) await supabase.from("tbr_teams").insert(rows)
}
