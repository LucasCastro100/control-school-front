import type { AgendaItem } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

interface AgendaRow {
  id: string
  date: string
  start_time: string
  end_time: string
  activity: string
  created_at: string
  orientadores?: { id: string }[]
}

function rowToItem(row: AgendaRow): AgendaItem {
  const item = toCamel<Omit<AgendaItem, "orientadorIds">>(row as unknown as Record<string, unknown>)
  return {
    ...item,
    orientadorIds: (row.orientadores ?? []).map((o) => o.id),
  }
}

export async function getAgendaItems(): Promise<AgendaItem[]> {
  const data = await api<AgendaRow[]>("/agenda")
  return (data ?? []).map(rowToItem)
}

export async function getAgendaItemsByOrientador(orientadorId: string): Promise<AgendaItem[]> {
  const data = await api<AgendaRow[]>("/agenda", { query: { orientador_id: orientadorId } })
  return (data ?? []).map(rowToItem)
}

export async function getAgendaItem(id: string): Promise<AgendaItem | undefined> {
  try {
    const data = await api<AgendaRow>(`/agenda/${id}`)
    return rowToItem(data)
  } catch {
    return undefined
  }
}

export async function createAgendaItem(data: Omit<AgendaItem, "id" | "createdAt">): Promise<AgendaItem> {
  const created = await api<AgendaRow>("/agenda", {
    method: "POST",
    body: {
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      activity: data.activity,
      orientador_ids: data.orientadorIds,
    },
  })
  return rowToItem(created)
}

export async function updateAgendaItem(id: string, data: Partial<Omit<AgendaItem, "id" | "createdAt">>): Promise<AgendaItem | undefined> {
  const body: Record<string, unknown> = {}
  if (data.date !== undefined) body.date = data.date
  if (data.startTime !== undefined) body.start_time = data.startTime
  if (data.endTime !== undefined) body.end_time = data.endTime
  if (data.activity !== undefined) body.activity = data.activity
  if (data.orientadorIds !== undefined) body.orientador_ids = data.orientadorIds

  try {
    const updated = await api<AgendaRow>(`/agenda/${id}`, { method: "PUT", body })
    return rowToItem(updated)
  } catch {
    return undefined
  }
}

export async function deleteAgendaItem(id: string): Promise<void> {
  await api<void>(`/agenda/${id}`, { method: "DELETE" })
}