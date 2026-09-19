import type { Item } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function getAllItems(category?: string): Promise<Item[]> {
  const data = await api<Record<string, unknown>[]>("/items", { query: { category } })
  return (data ?? []).map(toCamel<Item>)
}

export async function getItem(id: string): Promise<Item | undefined> {
  try {
    const data = await api<Record<string, unknown>>(`/items/${id}`)
    return toCamel<Item>(data)
  } catch {
    return undefined
  }
}

export async function createItem(data: Omit<Item, "id" | "createdAt">): Promise<Item> {
  const created = await api<Record<string, unknown>>("/items", {
    method: "POST",
    body: { name: data.name, category: data.category, naps: data.naps },
  })
  return toCamel<Item>(created)
}

export async function updateItem(id: string, data: Partial<Omit<Item, "id" | "createdAt">>): Promise<Item | undefined> {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.category !== undefined) body.category = data.category
  if (data.naps !== undefined) body.naps = data.naps

  try {
    const updated = await api<Record<string, unknown>>(`/items/${id}`, { method: "PUT", body })
    return toCamel<Item>(updated)
  } catch {
    return undefined
  }
}

export async function deleteItem(id: string): Promise<void> {
  await api<void>(`/items/${id}`, { method: "DELETE" })
}