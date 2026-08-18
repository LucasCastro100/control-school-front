import type { Student } from "../types"
import { supabase } from "../supabase"
import { generateId, toCamel, toSnake } from "./helpers"

export async function getStudents(): Promise<Student[]> {
  const { data } = await supabase.from("students").select("*")
  return (data ?? []).map(toCamel<Student>)
}

export async function getStudentsByRoom(roomId: string): Promise<Student[]> {
  const { data } = await supabase.from("students").select("*").eq("room_id", roomId)
  return (data ?? []).map(toCamel<Student>)
}

export async function createStudent(data: Omit<Student, "id" | "createdAt">): Promise<Student> {
  const row = { ...toSnake(data as Record<string, unknown>), id: generateId(), created_at: new Date().toISOString() }
  const { error } = await supabase.from("students").insert(row)
  if (error) throw error
  return toCamel<Student>(row)
}

export async function updateStudent(id: string, data: Partial<Omit<Student, "id" | "createdAt">>): Promise<Student | undefined> {
  const snakeData = toSnake(data as Record<string, unknown>)
  const { data: updated } = await supabase.from("students").update(snakeData).eq("id", id).select().single()
  return updated ? toCamel<Student>(updated) : undefined
}

export async function deleteStudent(id: string): Promise<void> {
  await supabase.from("students").delete().eq("id", id)
}
