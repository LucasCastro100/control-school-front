import type { School } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId, toCamel, toSnake } from "./helpers"
import { getClasses } from "./classes"
import { hashPassword } from "@/lib/auth/crypto"

export async function getSchools(): Promise<School[]> {
  const { data } = await supabase.from("schools").select("*").order("created_at", { ascending: false })
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
  const { data: napItems } = await supabase.from("nap_items").select("year")
  const classYears = classes.map((c) => c.year).filter(Boolean)
  const napItemYears = (napItems ?? []).map((n) => n.year).filter(Boolean)
  const sorted = Array.from(new Set([...classYears, ...napItemYears])).sort()
  return sorted.length > 0 ? sorted : [String(new Date().getFullYear())]
}

export async function getSchool(id: string): Promise<School | undefined> {
  const { data } = await supabase.from("schools").select("*").eq("id", id).single()
  return data ? toCamel<School>(data) : undefined
}

export async function createSchool(data: Omit<School, "id" | "createdAt">): Promise<School> {
  const password = data.password || "mudar123"
  const hashedPassword = await hashPassword(password)

  const school = {
    ...toSnake(data as Record<string, unknown>),
    password: hashedPassword,
    id: generateId(),
    created_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("schools").insert(school)
  if (error) throw error

  if (data.email) {
    await supabase.from("users").insert({
      id: generateId(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "escola",
      created_at: new Date().toISOString(),
    })
  }

  return toCamel<School>(school)
}

export async function updateSchool(id: string, data: Partial<Omit<School, "id" | "createdAt">>): Promise<School | undefined> {
  const snakeData = toSnake(data as Record<string, unknown>)
  if (snakeData.password) {
    snakeData.password = await hashPassword(snakeData.password as string)
  }
  const { data: updated } = await supabase.from("schools").update(snakeData).eq("id", id).select().single()
  return updated ? toCamel<School>(updated) : undefined
}

export async function deleteSchool(id: string): Promise<void> {
  await supabase.from("schools").delete().eq("id", id)
}
