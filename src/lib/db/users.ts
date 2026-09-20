import type { Role, User } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function getUsers(): Promise<User[]> {
  const data = await api<Record<string, unknown>[]>("/users")
  return (data ?? []).map(toCamel<User>)
}

export async function getUsersByRole(role: User["role"]): Promise<User[]> {
  const data = await api<Record<string, unknown>[]>("/users", { query: { role } })
  return (data ?? []).map(toCamel<User>)
}

export async function getUser(id: string): Promise<User | undefined> {
  try {
    const data = await api<Record<string, unknown>>(`/users/${id}`)
    return toCamel<User>(data)
  } catch {
    return undefined
  }
}

export async function getRoles(): Promise<Role[]> {
  const data = await api<Record<string, unknown>[]>("/roles")
  return (data ?? []).map(toCamel<Role>)
}

export async function createUser(
  data: Omit<User, "id" | "createdAt">
): Promise<User> {
  const created = await api<Record<string, unknown>>("/users", {
    method: "POST",
    body: {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      role_id: data.roleId ?? null,
    },
  })
  return toCamel<User>(created)
}

export async function updateUser(id: string, data: Partial<Omit<User, "id" | "createdAt">>): Promise<User | undefined> {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.email !== undefined) body.email = data.email
  if (data.password !== undefined) body.password = data.password
  if (data.role !== undefined) body.role = data.role
  if (data.roleId !== undefined) body.role_id = data.roleId ?? null

  try {
    const updated = await api<Record<string, unknown>>(`/users/${id}`, { method: "PUT", body })
    return toCamel<User>(updated)
  } catch {
    return undefined
  }
}

export async function deleteUser(id: string): Promise<void> {
  await api<void>(`/users/${id}`, { method: "DELETE" })
}

// ===== USER_SCHOOLS (pivot) =====
export async function getSchoolsByUser(userId: string): Promise<string[]> {
  const data = await api<Record<string, unknown>[]>(`/users/${userId}/schools`)
  return (data ?? []).map((r) => r.id as string)
}

export async function getUsersBySchool(schoolId: string): Promise<string[]> {
  const data = await api<Record<string, unknown>[]>("/users", { query: { school_id: schoolId } })
  return (data ?? []).map((r) => r.id as string)
}

export async function getSchoolUsers(schoolId: string): Promise<User[]> {
  const data = await api<Record<string, unknown>[]>(`/schools/${schoolId}/users`)
  return (data ?? []).map(toCamel<User>)
}

export async function addUserSchool(userId: string, schoolId: string, nap?: string): Promise<void> {
  await api<void>(`/users/${userId}/schools`, {
    method: "POST",
    body: { school_id: schoolId, nap: nap ?? null },
  })
}

export async function removeUserSchool(userId: string, schoolId: string): Promise<void> {
  await api<void>(`/users/${userId}/schools/${schoolId}`, { method: "DELETE" })
}

export async function replaceUserSchools(userId: string, schoolIds: string[]): Promise<void> {
  await api<void>(`/users/${userId}/schools`, { method: "PUT", body: { school_ids: schoolIds } })
}

export async function replaceUserSchoolsWithNap(
  userId: string,
  links: { schoolId: string; nap?: string | null }[]
): Promise<void> {
  await api<void>(`/users/${userId}/schools`, {
    method: "PUT",
    body: {
      school_links: links.map((l) => ({ school_id: l.schoolId, nap: l.nap ?? null })),
    },
  })
}