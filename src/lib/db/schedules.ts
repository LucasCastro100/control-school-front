import type { Schedule } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId, toCamel, toSnake } from "./helpers"

export async function getSchedules(): Promise<Schedule[]> {
  const { data } = await supabase.from("schedules").select("*")
  return (data ?? []).map(toCamel<Schedule>)
}

export async function getSchedulesByClass(classId: string): Promise<Schedule[]> {
  const { data } = await supabase.from("schedules").select("*").eq("class_id", classId)
  return (data ?? []).map(toCamel<Schedule>)
}

export async function getSchedulesByRoom(roomId: string): Promise<Schedule[]> {
  const { data } = await supabase.from("schedules").select("*").eq("room_id", roomId)
  return (data ?? []).map(toCamel<Schedule>)
}

export async function createSchedule(data: Omit<Schedule, "id">): Promise<Schedule> {
  const row = { ...toSnake(data as Record<string, unknown>), id: generateId() }
  const { error } = await supabase.from("schedules").insert(row)
  if (error) throw error
  return toCamel<Schedule>(row)
}

export async function updateSchedule(id: string, data: Partial<Omit<Schedule, "id">>): Promise<Schedule | undefined> {
  const snakeData = toSnake(data as Record<string, unknown>)
  const { data: updated } = await supabase.from("schedules").update(snakeData).eq("id", id).select().single()
  return updated ? toCamel<Schedule>(updated) : undefined
}

export async function deleteSchedule(id: string): Promise<void> {
  await supabase.from("schedules").delete().eq("id", id)
}
