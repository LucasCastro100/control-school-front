import type { NapItem } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId, toCamel } from "./helpers"

export async function getNapItems(schoolId: string): Promise<NapItem[]> {
  const { data } = await supabase.from("nap_items").select("*").eq("school_id", schoolId)
  return (data ?? []).map(toCamel<NapItem>)
}

export async function getAllNapItems(): Promise<NapItem[]> {
  const { data } = await supabase.from("nap_items").select("*")
  return (data ?? []).map(toCamel<NapItem>)
}

export async function getNapItemsBySchoolAndYear(schoolId: string, year: string): Promise<NapItem[]> {
  const { data } = await supabase.from("nap_items").select("*").eq("school_id", schoolId).eq("year", year)
  return (data ?? []).map(toCamel<NapItem>)
}

export async function getNapItemsBySegment(schoolId: string, segmentName: string, year?: string): Promise<NapItem[]> {
  let query = supabase.from("nap_items").select("*").eq("school_id", schoolId).eq("segment_name", segmentName)
  if (year) query = query.eq("year", year)
  const { data } = await query
  return (data ?? []).map(toCamel<NapItem>)
}

export async function upsertNapItem(schoolId: string, segmentName: string, itemId: string, quantity: number, year: string): Promise<NapItem> {
  const { data: existing } = await supabase.from("nap_items").select("*").eq("school_id", schoolId).eq("segment_name", segmentName).eq("item_id", itemId).eq("year", year).single()
  if (existing) {
    const { data: updated } = await supabase.from("nap_items").update({ quantity }).eq("id", existing.id).select().single()
    return toCamel<NapItem>(updated!)
  }
  const row = { id: generateId(), school_id: schoolId, segment_name: segmentName, item_id: itemId, quantity, year }
  await supabase.from("nap_items").insert(row)
  return toCamel<NapItem>(row)
}

export async function deleteNapItem(id: string): Promise<void> {
  await supabase.from("nap_items").delete().eq("id", id)
}

export async function deleteNapItemsBySchool(schoolId: string): Promise<void> {
  await supabase.from("nap_items").delete().eq("school_id", schoolId)
}

export async function deleteNapItemsBySchoolAndYear(schoolId: string, year: string): Promise<void> {
  await supabase.from("nap_items").delete().eq("school_id", schoolId).eq("year", year)
}
