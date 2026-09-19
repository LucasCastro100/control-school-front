import type { TbrCategory, TbrTeam } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

// ===== TBR CATEGORIES =====
export async function getTbrCategories(): Promise<TbrCategory[]> {
  const data = await api<Record<string, unknown>[]>("/tbr-categories")
  return (data ?? []).map(toCamel<TbrCategory>)
}

export async function getTbrCategory(id: string): Promise<TbrCategory | undefined> {
  try {
    const data = await api<Record<string, unknown>>(`/tbr-categories/${id}`)
    return toCamel<TbrCategory>(data)
  } catch {
    return undefined
  }
}

export async function createTbrCategory(data: Omit<TbrCategory, "id" | "createdAt">): Promise<TbrCategory> {
  const created = await api<Record<string, unknown>>("/tbr-categories", {
    method: "POST",
    body: { name: data.name },
  })
  return toCamel<TbrCategory>(created)
}

export async function updateTbrCategory(id: string, data: Partial<Omit<TbrCategory, "id" | "createdAt">>): Promise<TbrCategory | undefined> {
  try {
    const updated = await api<Record<string, unknown>>(`/tbr-categories/${id}`, {
      method: "PUT",
      body: { name: data.name },
    })
    return toCamel<TbrCategory>(updated)
  } catch {
    return undefined
  }
}

export async function deleteTbrCategory(id: string): Promise<void> {
  await api<void>(`/tbr-categories/${id}`, { method: "DELETE" })
}

// ===== TBR TEAMS =====
export async function getAllTbrTeams(): Promise<TbrTeam[]> {
  const data = await api<Record<string, unknown>[]>("/tbr-teams")
  return (data ?? []).map(toCamel<TbrTeam>)
}

export async function getTbrTeamsBySchool(schoolId: string): Promise<TbrTeam[]> {
  const data = await api<Record<string, unknown>[]>("/tbr-teams", { query: { school_id: schoolId } })
  return (data ?? []).map(toCamel<TbrTeam>)
}

export async function getTbrTeamsByCategory(categoryId: string): Promise<TbrTeam[]> {
  const data = await api<Record<string, unknown>[]>("/tbr-teams", { query: { category_id: categoryId } })
  return (data ?? []).map(toCamel<TbrTeam>)
}

export async function createTbrTeam(data: Omit<TbrTeam, "id" | "createdAt">): Promise<TbrTeam> {
  const created = await api<Record<string, unknown>>("/tbr-teams", {
    method: "POST",
    body: { school_id: data.schoolId, category_id: data.categoryId, name: data.name },
  })
  return toCamel<TbrTeam>(created)
}

export async function deleteTbrTeam(id: string): Promise<void> {
  await api<void>(`/tbr-teams/${id}`, { method: "DELETE" })
}

export async function deleteTbrTeamsBySchool(schoolId: string): Promise<void> {
  await api<void>(`/tbr-teams/by-school/${schoolId}`, { method: "DELETE" })
}

export async function replaceTbrTeamsForSchool(schoolId: string, teams: { categoryId: string; name: string }[]): Promise<void> {
  await api<void>(`/tbr-teams/replace-for-school/${schoolId}`, {
    method: "PUT",
    body: {
      teams: teams.map((t) => ({ category_id: t.categoryId, name: t.name })),
    },
  })
}