import type { Room } from "../types"
import { supabase } from "../supabase"
import { generateId, toCamel, toSnake } from "./helpers"

export async function getRooms(): Promise<Room[]> {
  const { data } = await supabase.from("rooms").select("*")
  return (data ?? []).map(toCamel<Room>)
}

export async function getRoomsByClass(classId: string): Promise<Room[]> {
  const { data } = await supabase.from("rooms").select("*").eq("class_id", classId)
  return (data ?? []).map(toCamel<Room>)
}

export async function getRoom(id: string): Promise<Room | undefined> {
  const { data } = await supabase.from("rooms").select("*").eq("id", id).single()
  return data ? toCamel<Room>(data) : undefined
}

export async function createRoom(data: Omit<Room, "id" | "createdAt">): Promise<Room> {
  const row = { ...toSnake(data as Record<string, unknown>), id: generateId(), created_at: new Date().toISOString() }
  const { error } = await supabase.from("rooms").insert(row)
  if (error) throw error
  return toCamel<Room>(row)
}

export async function updateRoom(id: string, data: Partial<Omit<Room, "id" | "createdAt">>): Promise<Room | undefined> {
  const snakeData = toSnake(data as Record<string, unknown>)
  const { data: updated } = await supabase.from("rooms").update(snakeData).eq("id", id).select().single()
  return updated ? toCamel<Room>(updated) : undefined
}

export async function deleteRoom(id: string): Promise<void> {
  await supabase.from("rooms").delete().eq("id", id)
}
