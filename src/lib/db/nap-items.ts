import type { NapItem } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function getNapItems(schoolId: string): Promise<NapItem[]> {
  const data = await api<Record<string, unknown>[]>("/nap-items", { query: { school_id: schoolId } })
  return (data ?? []).map(toCamel<NapItem>)
}

export async function getAllNapItems(): Promise<NapItem[]> {
  const data = await api<Record<string, unknown>[]>("/nap-items")
  return (data ?? []).map(toCamel<NapItem>)
}

export async function getNapItemsBySchoolAndYear(schoolId: string, year: string): Promise<NapItem[]> {
  const data = await api<Record<string, unknown>[]>("/nap-items", { query: { school_id: schoolId, year } })
  return (data ?? []).map(toCamel<NapItem>)
}

export async function getNapItemsBySegment(schoolId: string, segmentName: string, year?: string): Promise<NapItem[]> {
  const data = await api<Record<string, unknown>[]>("/nap-items", {
    query: { school_id: schoolId, segment_name: segmentName, ...(year ? { year } : {}) },
  })
  return (data ?? []).map(toCamel<NapItem>)
}

export async function upsertNapItem(schoolId: string, segmentName: string, itemId: string, quantity: number, year: string): Promise<NapItem> {
  const created = await api<Record<string, unknown>>("/nap-items/upsert", {
    method: "POST",
    body: { school_id: schoolId, segment_name: segmentName, item_id: itemId, quantity, year },
  })
  return toCamel<NapItem>(created)
}

export async function deleteNapItem(id: string): Promise<void> {
  await api<void>(`/nap-items/${id}`, { method: "DELETE" })
}

export async function deleteNapItemsBySchool(schoolId: string): Promise<void> {
  await api<void>(`/nap-items/by-school/${schoolId}`, { method: "DELETE" })
}

export async function deleteNapItemsBySchoolAndYear(schoolId: string, year: string): Promise<void> {
  await api<void>(`/nap-items/by-school-and-year/${schoolId}/${year}`, { method: "DELETE" })
}