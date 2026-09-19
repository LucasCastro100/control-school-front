import type { OrientadorSchedule } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function getOrientadorSchedules(): Promise<OrientadorSchedule[]> {
  const data = await api<Record<string, unknown>[]>("/orientador-schedules")
  return (data ?? []).map(toCamel<OrientadorSchedule>)
}

export async function getOrientadorSchedulesBySchool(schoolId: string, year: string): Promise<OrientadorSchedule[]> {
  const data = await api<Record<string, unknown>[]>("/orientador-schedules", { query: { school_id: schoolId, year } })
  return (data ?? []).map(toCamel<OrientadorSchedule>)
}

export async function createOrientadorSchedule(data: Omit<OrientadorSchedule, "id" | "createdAt">): Promise<OrientadorSchedule> {
  const created = await api<Record<string, unknown>>("/orientador-schedules", {
    method: "POST",
    body: {
      school_id: data.schoolId,
      orientador_id: data.orientadorId,
      day_of_week: data.dayOfWeek,
      start_time: data.startTime,
      end_time: data.endTime,
      activity: data.activity,
      year: data.year,
    },
  })
  return toCamel<OrientadorSchedule>(created)
}

export async function updateOrientadorSchedule(id: string, data: Partial<Omit<OrientadorSchedule, "id" | "createdAt">>): Promise<OrientadorSchedule | undefined> {
  const body: Record<string, unknown> = {}
  if (data.schoolId !== undefined) body.school_id = data.schoolId
  if (data.orientadorId !== undefined) body.orientador_id = data.orientadorId
  if (data.dayOfWeek !== undefined) body.day_of_week = data.dayOfWeek
  if (data.startTime !== undefined) body.start_time = data.startTime
  if (data.endTime !== undefined) body.end_time = data.endTime
  if (data.activity !== undefined) body.activity = data.activity
  if (data.year !== undefined) body.year = data.year

  try {
    const updated = await api<Record<string, unknown>>(`/orientador-schedules/${id}`, { method: "PUT", body })
    return toCamel<OrientadorSchedule>(updated)
  } catch {
    return undefined
  }
}

export async function deleteOrientadorSchedule(id: string): Promise<void> {
  await api<void>(`/orientador-schedules/${id}`, { method: "DELETE" })
}

export async function deleteOrientadorSchedulesBySchool(schoolId: string): Promise<void> {
  await api<void>(`/orientador-schedules/by-school/${schoolId}`, { method: "DELETE" })
}