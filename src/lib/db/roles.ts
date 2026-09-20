import type { Role } from "../types"
import { api } from "@/lib/backend"
import { toCamel } from "./helpers"

export async function createRole(data: { name: string; permissions: string[] }): Promise<Role> {
  const created = await api<Record<string, unknown>>("/roles", {
    method: "POST",
    body: {
      name: data.name,
      permissions: data.permissions,
    },
  })
  return toCamel<Role>(created)
}

export async function updateRole(
  id: string,
  data: { name: string; permissions: string[] }
): Promise<Role> {
  const updated = await api<Record<string, unknown>>(`/roles/${id}`, {
    method: "PUT",
    body: {
      name: data.name,
      permissions: data.permissions,
    },
  })
  return toCamel<Role>(updated)
}

export async function deleteRole(id: string): Promise<void> {
  await api<void>(`/roles/${id}`, { method: "DELETE" })
}