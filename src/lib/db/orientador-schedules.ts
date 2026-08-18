import type { OrientadorSchedule } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId, toCamel, toSnake } from "./helpers"

export async function getOrientadorSchedules(): Promise<OrientadorSchedule[]> {
  const { data } = await supabase.from("orientador_schedules").select("*")
  return (data ?? []).map(toCamel<OrientadorSchedule>)
}

export async function getOrientadorSchedulesBySchool(schoolId: string, year: string): Promise<OrientadorSchedule[]> {
  const { data } = await supabase.from("orientador_schedules").select("*").eq("school_id", schoolId).eq("year", year)
  return (data ?? []).map(toCamel<OrientadorSchedule>)
}

export async function createOrientadorSchedule(data: Omit<OrientadorSchedule, "id" | "createdAt">): Promise<OrientadorSchedule> {
  const row = { ...toSnake(data as Record<string, unknown>), id: generateId(), created_at: new Date().toISOString() }
  const { error } = await supabase.from("orientador_schedules").insert(row)
  if (error) throw error
  return toCamel<OrientadorSchedule>(row)
}

export async function updateOrientadorSchedule(id: string, data: Partial<Omit<OrientadorSchedule, "id" | "createdAt">>): Promise<OrientadorSchedule | undefined> {
  const snakeData = toSnake(data as Record<string, unknown>)
  const { data: updated } = await supabase.from("orientador_schedules").update(snakeData).eq("id", id).select().single()
  return updated ? toCamel<OrientadorSchedule>(updated) : undefined
}

export async function deleteOrientadorSchedule(id: string): Promise<void> {
  await supabase.from("orientador_schedules").delete().eq("id", id)
}

export async function deleteOrientadorSchedulesBySchool(schoolId: string): Promise<void> {
  await supabase.from("orientador_schedules").delete().eq("school_id", schoolId)
}
