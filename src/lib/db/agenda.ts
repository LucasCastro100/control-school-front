import type { AgendaItem } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId, toCamel, toSnake } from "./helpers"

export async function getAgendaItems(): Promise<AgendaItem[]> {
  const { data } = await supabase.from("agenda").select("*")
  return (data ?? []).map(toCamel<AgendaItem>)
}

export async function getAgendaItemsByOrientador(orientadorId: string): Promise<AgendaItem[]> {
  const { data } = await supabase.from("agenda").select("*").eq("orientador_id", orientadorId)
  return (data ?? []).map(toCamel<AgendaItem>)
}

export async function getAgendaItem(id: string): Promise<AgendaItem | undefined> {
  const { data } = await supabase.from("agenda").select("*").eq("id", id).single()
  return data ? toCamel<AgendaItem>(data) : undefined
}

export async function createAgendaItem(data: Omit<AgendaItem, "id" | "createdAt">): Promise<AgendaItem> {
  const row = { ...toSnake(data as Record<string, unknown>), id: generateId(), created_at: new Date().toISOString() }
  const { error } = await supabase.from("agenda").insert(row)
  if (error) throw error
  return toCamel<AgendaItem>(row)
}

export async function updateAgendaItem(id: string, data: Partial<Omit<AgendaItem, "id" | "createdAt">>): Promise<AgendaItem | undefined> {
  const snakeData = toSnake(data as Record<string, unknown>)
  const { data: updated } = await supabase.from("agenda").update(snakeData).eq("id", id).select().single()
  return updated ? toCamel<AgendaItem>(updated) : undefined
}

export async function deleteAgendaItem(id: string): Promise<void> {
  await supabase.from("agenda").delete().eq("id", id)
}
