import type { Schedule } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function getSchedules(): Promise<Schedule[]> {
  const data = await api<Record<string, unknown>[]>("/schedules")
  return (data ?? []).map(toCamel<Schedule>)
}

export async function getSchedulesByClass(classId: string): Promise<Schedule[]> {
  const data = await api<Record<string, unknown>[]>("/schedules", { query: { class_id: classId } })
  return (data ?? []).map(toCamel<Schedule>)
}

export async function getSchedulesByRoom(roomId: string): Promise<Schedule[]> {
  const data = await api<Record<string, unknown>[]>("/schedules", { query: { room_id: roomId } })
  return (data ?? []).map(toCamel<Schedule>)
}

export async function createSchedule(data: Omit<Schedule, "id">): Promise<Schedule> {
  const body: Record<string, unknown> = {
    class_id: data.classId,
    room_id: data.roomId ?? null,
    day_of_week: data.dayOfWeek,
    start_time: data.startTime,
    end_time: data.endTime,
    subject: data.subject,
    teacher: data.teacher,
    fortnight: data.fortnight ?? null,
  }
  const created = await api<Record<string, unknown>>("/schedules", { method: "POST", body })
  return toCamel<Schedule>(created)
}

export async function updateSchedule(id: string, data: Partial<Omit<Schedule, "id">>): Promise<Schedule | undefined> {
  const body: Record<string, unknown> = {}
  if (data.classId !== undefined) body.class_id = data.classId
  if (data.roomId !== undefined) body.room_id = data.roomId ?? null
  if (data.dayOfWeek !== undefined) body.day_of_week = data.dayOfWeek
  if (data.startTime !== undefined) body.start_time = data.startTime
  if (data.endTime !== undefined) body.end_time = data.endTime
  if (data.subject !== undefined) body.subject = data.subject
  if (data.teacher !== undefined) body.teacher = data.teacher
  if (data.fortnight !== undefined) body.fortnight = data.fortnight

  try {
    const updated = await api<Record<string, unknown>>(`/schedules/${id}`, { method: "PUT", body })
    return toCamel<Schedule>(updated)
  } catch {
    return undefined
  }
}

export async function deleteSchedule(id: string): Promise<void> {
  await api<void>(`/schedules/${id}`, { method: "DELETE" })
}