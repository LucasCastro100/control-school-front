import type { SegmentConfig } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function getSegmentConfigs(schoolId: string): Promise<SegmentConfig[]> {
  const data = await api<Record<string, unknown>[]>("/segment-configs", { query: { school_id: schoolId } })
  return (data ?? []).map(toCamel<SegmentConfig>)
}

export async function getSegmentConfigsAll(): Promise<SegmentConfig[]> {
  const data = await api<Record<string, unknown>[]>("/segment-configs")
  return (data ?? []).map(toCamel<SegmentConfig>)
}

export async function getSegmentConfig(schoolId: string, segmentName: string): Promise<SegmentConfig | undefined> {
  const configs = await getSegmentConfigs(schoolId)
  return configs.find((c) => c.segmentName === segmentName)
}

export async function upsertSegmentConfig(schoolId: string, segmentName: string, data: { tapetes: number; kits: number }, year: string): Promise<SegmentConfig> {
  const created = await api<Record<string, unknown>>("/segment-configs/upsert", {
    method: "POST",
    body: { school_id: schoolId, segment_name: segmentName, tapetes: data.tapetes, kits: data.kits, year },
  })
  return toCamel<SegmentConfig>(created)
}

export async function deleteSegmentConfig(id: string): Promise<void> {
  await api<void>(`/segment-configs/${id}`, { method: "DELETE" })
}

export async function deleteSegmentConfigsBySchool(schoolId: string): Promise<void> {
  await api<void>(`/segment-configs/by-school/${schoolId}`, { method: "DELETE" })
}