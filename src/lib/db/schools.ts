import type { School } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"
import { getClasses } from "./classes"
import { getAllNapItems } from "./nap-items"

export async function getSchools(): Promise<School[]> {
  const data = await api<Record<string, unknown>[]>("/schools")
  return (data ?? []).map(toCamel<School>)
}

export async function getSchoolsByYear(year: string): Promise<School[]> {
  const all = await getSchools()
  return all.filter((s) => new Date(s.createdAt).getFullYear().toString() === year)
}

export async function getSchoolYears(): Promise<string[]> {
  const schools = await getSchools()
  const classes = await getClasses()
  const schoolYears = schools.map((s) => new Date(s.createdAt).getFullYear().toString()).filter(Boolean)
  const classYears = classes.map((c) => c.year).filter(Boolean)
  return Array.from(new Set([...schoolYears, ...classYears])).sort()
}

export async function getAcademicYears(): Promise<string[]> {
  const classes = await getClasses()
  const napItems = await getAllNapItems()
  const classYears = classes.map((c) => c.year).filter(Boolean)
  const napItemYears = napItems.map((n) => n.year).filter(Boolean)
  const sorted = Array.from(new Set([...classYears, ...napItemYears])).sort()
  return sorted.length > 0 ? sorted : [String(new Date().getFullYear())]
}

export async function getSchool(id: string): Promise<School | undefined> {
  try {
    const data = await api<Record<string, unknown>>(`/schools/${id}`)
    return toCamel<School>(data)
  } catch {
    return undefined
  }
}

export async function createSchool(data: Omit<School, "id" | "createdAt">): Promise<School> {
  const body: Record<string, unknown> = {
    name: data.name,
    address: data.address,
    region: data.region,
    state: data.state,
    city: data.city,
    color: data.color,
    email: data.email,
    schedule_type: data.scheduleType,
    active: data.active,
  }
  if (data.password) body.password = data.password

  const created = await api<Record<string, unknown>>("/schools", { method: "POST", body })
  return toCamel<School>(created)
}

export async function updateSchool(id: string, data: Partial<Omit<School, "id" | "createdAt">>): Promise<School | undefined> {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.address !== undefined) body.address = data.address
  if (data.region !== undefined) body.region = data.region
  if (data.state !== undefined) body.state = data.state
  if (data.city !== undefined) body.city = data.city
  if (data.color !== undefined) body.color = data.color
  if (data.email !== undefined) body.email = data.email
  if (data.password !== undefined) body.password = data.password
  if (data.scheduleType !== undefined) body.schedule_type = data.scheduleType
  if (data.active !== undefined) body.active = data.active

  try {
    const updated = await api<Record<string, unknown>>(`/schools/${id}`, { method: "PUT", body })
    return toCamel<School>(updated)
  } catch {
    return undefined
  }
}

export async function deleteSchool(id: string): Promise<void> {
  await api<void>(`/schools/${id}`, { method: "DELETE" })
}