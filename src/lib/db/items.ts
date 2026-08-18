import type { Item } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId, toCamel } from "./helpers"

export async function getAllItems(): Promise<Item[]> {
  const { data } = await supabase.from("items").select("*")
  return (data ?? []).map((row) => {
    const item = toCamel<Item>(row)
    if (typeof item.naps === "string") item.naps = JSON.parse(item.naps as string)
    return item
  })
}

export async function getItem(id: string): Promise<Item | undefined> {
  const { data } = await supabase.from("items").select("*").eq("id", id).single()
  if (!data) return undefined
  const item = toCamel<Item>(data)
  if (typeof item.naps === "string") item.naps = JSON.parse(item.naps as string)
  return item
}

export async function createItem(data: Omit<Item, "id" | "createdAt">): Promise<Item> {
  const row = { id: generateId(), name: data.name, category: data.category, naps: JSON.stringify(data.naps), created_at: new Date().toISOString() }
  const { error } = await supabase.from("items").insert(row)
  if (error) throw error
  return { ...data, id: row.id, createdAt: row.created_at }
}

export async function updateItem(id: string, data: Partial<Omit<Item, "id" | "createdAt">>): Promise<Item | undefined> {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.category !== undefined) updateData.category = data.category
  if (data.naps !== undefined) updateData.naps = JSON.stringify(data.naps)
  const { data: updated } = await supabase.from("items").update(updateData).eq("id", id).select().single()
  if (!updated) return undefined
  const item = toCamel<Item>(updated)
  if (typeof item.naps === "string") item.naps = JSON.parse(item.naps as string)
  return item
}

export async function deleteItem(id: string): Promise<void> {
  await supabase.from("items").delete().eq("id", id)
}
