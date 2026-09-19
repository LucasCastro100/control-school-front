import type { Class } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function getClasses(): Promise<Class[]> {
  const data = await api<Record<string, unknown>[]>("/classes")
  return (data ?? []).map(toCamel<Class>)
}

export async function getClassesBySchool(schoolId: string): Promise<Class[]> {
  const data = await api<Record<string, unknown>[]>("/classes", { query: { school_id: schoolId } })
  return (data ?? []).map(toCamel<Class>)
}

export async function getClass(id: string): Promise<Class | undefined> {
  try {
    const data = await api<Record<string, unknown>>(`/classes/${id}`)
    return toCamel<Class>(data)
  } catch {
    return undefined
  }
}

export async function getClassesBySchoolAndYear(schoolId: string, year: string): Promise<Class[]> {
  const data = await api<Record<string, unknown>[]>("/classes", { query: { school_id: schoolId, year } })
  return (data ?? []).map(toCamel<Class>)
}

export async function createClass(data: Omit<Class, "id" | "createdAt">): Promise<Class> {
  const created = await api<Record<string, unknown>>("/classes", {
    method: "POST",
    body: { school_id: data.schoolId, nap: data.nap, name: data.name, year: data.year },
  })
  return toCamel<Class>(created)
}

export async function updateClass(id: string, data: Partial<Omit<Class, "id" | "createdAt">>): Promise<Class | undefined> {
  const body: Record<string, unknown> = {}
  if (data.schoolId !== undefined) body.school_id = data.schoolId
  if (data.nap !== undefined) body.nap = data.nap
  if (data.name !== undefined) body.name = data.name
  if (data.year !== undefined) body.year = data.year

  try {
    const updated = await api<Record<string, unknown>>(`/classes/${id}`, { method: "PUT", body })
    return toCamel<Class>(updated)
  } catch {
    return undefined
  }
}

export async function deleteClass(id: string): Promise<void> {
  await api<void>(`/classes/${id}`, { method: "DELETE" })
}