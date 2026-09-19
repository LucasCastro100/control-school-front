import type { Room } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function getRooms(): Promise<Room[]> {
  const data = await api<Record<string, unknown>[]>("/rooms")
  return (data ?? []).map(toCamel<Room>)
}

export async function getRoomsByClass(classId: string): Promise<Room[]> {
  const data = await api<Record<string, unknown>[]>("/rooms", { query: { class_id: classId } })
  return (data ?? []).map(toCamel<Room>)
}

export async function getRoom(id: string): Promise<Room | undefined> {
  try {
    const data = await api<Record<string, unknown>>(`/rooms/${id}`)
    return toCamel<Room>(data)
  } catch {
    return undefined
  }
}

export async function createRoom(data: Omit<Room, "id" | "createdAt">): Promise<Room> {
  const created = await api<Record<string, unknown>>("/rooms", {
    method: "POST",
    body: { class_id: data.classId, name: data.name, student_count: data.studentCount },
  })
  return toCamel<Room>(created)
}

export async function updateRoom(id: string, data: Partial<Omit<Room, "id" | "createdAt">>): Promise<Room | undefined> {
  const body: Record<string, unknown> = {}
  if (data.classId !== undefined) body.class_id = data.classId
  if (data.name !== undefined) body.name = data.name
  if (data.studentCount !== undefined) body.student_count = data.studentCount

  try {
    const updated = await api<Record<string, unknown>>(`/rooms/${id}`, { method: "PUT", body })
    return toCamel<Room>(updated)
  } catch {
    return undefined
  }
}

export async function deleteRoom(id: string): Promise<void> {
  await api<void>(`/rooms/${id}`, { method: "DELETE" })
}