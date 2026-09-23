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
  registrar_mundoz?: boolean
  escola?: string | null
  ano?: string | null
  tipo?: string | null
  confirmado_por?: string | null
  orientadores?: { id: string }[]
}

function rowToItem(row: AgendaRow): AgendaItem {
  const item = toCamel<Omit<AgendaItem, "orientadorIds">>(row as unknown as Record<string, unknown>)
  return {
    ...item,
    orientadorIds: (row.orientadores ?? []).map((o) => o.id),
    registrarMundoz: !!row.registrar_mundoz,
    escola: row.escola ?? undefined,
    ano: row.ano ?? undefined,
    tipo: row.tipo ?? undefined,
    confirmadoPor: row.confirmado_por ?? undefined,
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
    body: agendaBody(data),
  })
  return rowToItem(created)
}

function agendaBody(data: Partial<Omit<AgendaItem, "id" | "createdAt">>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (data.date !== undefined) body.date = data.date
  if (data.startTime !== undefined) body.start_time = data.startTime
  if (data.endTime !== undefined) body.end_time = data.endTime
  if (data.activity !== undefined) body.activity = data.activity
  if (data.orientadorIds !== undefined) body.orientador_ids = data.orientadorIds
  if (data.registrarMundoz !== undefined) body.registrar_mundoz = data.registrarMundoz
  if (data.escola !== undefined) body.escola = data.escola || null
  if (data.ano !== undefined) body.ano = data.ano || null
  if (data.tipo !== undefined) body.tipo = data.tipo || null
  if (data.confirmadoPor !== undefined) body.confirmado_por = data.confirmadoPor || null
  return body
}

export async function updateAgendaItem(id: string, data: Partial<Omit<AgendaItem, "id" | "createdAt">>): Promise<AgendaItem | undefined> {
  try {
    const updated = await api<AgendaRow>(`/agenda/${id}`, { method: "PUT", body: agendaBody(data) })
    return rowToItem(updated)
  } catch {
    return undefined
  }
}

export async function deleteAgendaItem(id: string): Promise<void> {
  await api<void>(`/agenda/${id}`, { method: "DELETE" })
}