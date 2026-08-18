import type { Class } from "../types"
import { supabase } from "../supabase"
import { generateId, toCamel, toSnake } from "./helpers"

export async function getClasses(): Promise<Class[]> {
  const { data } = await supabase.from("classes").select("*").order("created_at", { ascending: false })
  return (data ?? []).map(toCamel<Class>)
}

export async function getClassesBySchool(schoolId: string): Promise<Class[]> {
  const { data } = await supabase.from("classes").select("*").eq("school_id", schoolId)
  return (data ?? []).map(toCamel<Class>)
}

export async function getClass(id: string): Promise<Class | undefined> {
  const { data } = await supabase.from("classes").select("*").eq("id", id).single()
  return data ? toCamel<Class>(data) : undefined
}

export async function getClassesBySchoolAndYear(schoolId: string, year: string): Promise<Class[]> {
  const { data } = await supabase.from("classes").select("*").eq("school_id", schoolId).eq("year", year)
  return (data ?? []).map(toCamel<Class>)
}

export async function createClass(data: Omit<Class, "id" | "createdAt">): Promise<Class> {
  const row = { ...toSnake(data as Record<string, unknown>), id: generateId(), created_at: new Date().toISOString() }
  const { error } = await supabase.from("classes").insert(row)
  if (error) throw error
  return toCamel<Class>(row)
}

export async function updateClass(id: string, data: Partial<Omit<Class, "id" | "createdAt">>): Promise<Class | undefined> {
  const snakeData = toSnake(data as Record<string, unknown>)
  const { data: updated } = await supabase.from("classes").update(snakeData).eq("id", id).select().single()
  return updated ? toCamel<Class>(updated) : undefined
}

export async function deleteClass(id: string): Promise<void> {
  await supabase.from("classes").delete().eq("id", id)
}
