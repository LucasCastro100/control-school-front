import type { AgendaItem } from "../types"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { generateId } from "./helpers"

interface AgendaRow {
  id: string
  date: string
  start_time: string
  end_time: string
  activity: string
  created_at: string
}

interface AgendaOrientadorRow {
  agenda_id: string
  orientador_id: string
}

async function fetchOrientadorIds(agendaIds: string[]): Promise<Map<string, string[]>> {
  if (agendaIds.length === 0) return new Map()
  const { data } = await supabase
    .from("agenda_orientadores")
    .select("agenda_id, orientador_id")
    .in("agenda_id", agendaIds)
  const map = new Map<string, string[]>()
  for (const row of (data ?? []) as { agenda_id: string; orientador_id: string }[]) {
    const arr = map.get(row.agenda_id) ?? []
    arr.push(row.orientador_id)
    map.set(row.agenda_id, arr)
  }
  return map
}

function rowToItem(row: AgendaRow, orientadorIds: string[]): AgendaItem {
  return {
    id: row.id,
    orientadorIds,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    activity: row.activity,
    createdAt: row.created_at,
  }
}

export async function getAgendaItems(): Promise<AgendaItem[]> {
  const { data } = await supabase.from("agenda").select("*")
  const rows = (data ?? []) as AgendaRow[]
  const orientadorMap = await fetchOrientadorIds(rows.map((r) => r.id))
  return rows.map((r) => rowToItem(r, orientadorMap.get(r.id) ?? []))
}

export async function getAgendaItemsByOrientador(orientadorId: string): Promise<AgendaItem[]> {
  const { data: pivotData } = await supabase
    .from("agenda_orientadores")
    .select("agenda_id")
    .eq("orientador_id", orientadorId)
  const agendaIds = (pivotData ?? []).map((r) => r.agenda_id as string)
  if (agendaIds.length === 0) return []
  const { data } = await supabase.from("agenda").select("*").in("id", agendaIds)
  const rows = (data ?? []) as AgendaRow[]
  const orientadorMap = await fetchOrientadorIds(rows.map((r) => r.id))
  return rows.map((r) => rowToItem(r, orientadorMap.get(r.id) ?? []))
}

export async function getAgendaItem(id: string): Promise<AgendaItem | undefined> {
  const { data } = await supabase.from("agenda").select("*").eq("id", id).single()
  if (!data) return undefined
  const orientadorMap = await fetchOrientadorIds([id])
  return rowToItem(data as AgendaRow, orientadorMap.get(id) ?? [])
}

export async function createAgendaItem(data: Omit<AgendaItem, "id" | "createdAt">): Promise<AgendaItem> {
  const id = generateId()
  const row = {
    id,
    date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    activity: data.activity,
    created_at: new Date().toISOString(),
  }
  const { error } = await supabase.from("agenda").insert(row)
  if (error) throw error

  if (data.orientadorIds.length > 0) {
    const pivotRows = data.orientadorIds.map((oid) => ({
      agenda_id: id,
      orientador_id: oid,
    }))
    const { error: pivotError } = await supabase.from("agenda_orientadores").insert(pivotRows)
    if (pivotError) throw pivotError
  }

  return { ...rowToItem(row as AgendaRow, data.orientadorIds), createdAt: row.created_at }
}

export async function updateAgendaItem(id: string, data: Partial<Omit<AgendaItem, "id" | "createdAt">>): Promise<AgendaItem | undefined> {
  const updateRow: Record<string, unknown> = {}
  if (data.date !== undefined) updateRow.date = data.date
  if (data.startTime !== undefined) updateRow.start_time = data.startTime
  if (data.endTime !== undefined) updateRow.end_time = data.endTime
  if (data.activity !== undefined) updateRow.activity = data.activity

  if (Object.keys(updateRow).length > 0) {
    const { error } = await supabase.from("agenda").update(updateRow).eq("id", id)
    if (error) throw error
  }

  if (data.orientadorIds !== undefined) {
    await supabase.from("agenda_orientadores").delete().eq("agenda_id", id)
    if (data.orientadorIds.length > 0) {
      const pivotRows = data.orientadorIds.map((oid) => ({
        agenda_id: id,
        orientador_id: oid,
      }))
      const { error: pivotError } = await supabase.from("agenda_orientadores").insert(pivotRows)
      if (pivotError) throw pivotError
    }
  }

  return getAgendaItem(id)
}

export async function deleteAgendaItem(id: string): Promise<void> {
  await supabase.from("agenda").delete().eq("id", id)
}
