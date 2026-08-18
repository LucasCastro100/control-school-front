import type { SegmentConfig } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId, toCamel } from "./helpers"

export async function getSegmentConfigs(schoolId: string): Promise<SegmentConfig[]> {
  const { data } = await supabase.from("segment_configs").select("*").eq("school_id", schoolId)
  return (data ?? []).map(toCamel<SegmentConfig>)
}

export async function getSegmentConfigsAll(): Promise<SegmentConfig[]> {
  const { data } = await supabase.from("segment_configs").select("*")
  return (data ?? []).map(toCamel<SegmentConfig>)
}

export async function getSegmentConfig(schoolId: string, segmentName: string): Promise<SegmentConfig | undefined> {
  const { data } = await supabase.from("segment_configs").select("*").eq("school_id", schoolId).eq("segment_name", segmentName).single()
  return data ? toCamel<SegmentConfig>(data) : undefined
}

export async function upsertSegmentConfig(schoolId: string, segmentName: string, data: { tapetes: number; kits: number }, year: string): Promise<SegmentConfig> {
  const { data: existing } = await supabase.from("segment_configs").select("*").eq("school_id", schoolId).eq("segment_name", segmentName).eq("year", year).single()
  if (existing) {
    const { data: updated } = await supabase.from("segment_configs").update({ tapetes: data.tapetes, kits: data.kits }).eq("id", existing.id).select().single()
    return toCamel<SegmentConfig>(updated!)
  }
  const row = { id: generateId(), school_id: schoolId, segment_name: segmentName, tapetes: data.tapetes, kits: data.kits, year }
  await supabase.from("segment_configs").insert(row)
  return toCamel<SegmentConfig>(row)
}

export async function deleteSegmentConfig(id: string): Promise<void> {
  await supabase.from("segment_configs").delete().eq("id", id)
}

export async function deleteSegmentConfigsBySchool(schoolId: string): Promise<void> {
  await supabase.from("segment_configs").delete().eq("school_id", schoolId)
}
