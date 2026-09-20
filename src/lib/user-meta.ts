import type { Role, User } from "./types"

export const NAP_OPTIONS = ["NAP 1", "NAP 2", "NAP 3", "NAP 4"] as const

export const USER_ROLE_LABELS: Record<User["role"], string> = {
  admin: "Administrador",
  orientador: "Orientador",
  professor: "Professor",
  escola: "Acesso à escola",
}

export function roleDisplayName(user: Pick<User, "role" | "roleData">): string {
  if (user.roleData?.name) return user.roleData.name
  return USER_ROLE_LABELS[user.role] ?? user.role
}

export function roleBaseLabel(user: Pick<User, "role">): string {
  return USER_ROLE_LABELS[user.role] ?? user.role
}

export function roleTint(role: User["role"]): string {
  return {
    admin: "bg-primary/15 text-primary ring-primary/30",
    orientador: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
    professor: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
    escola: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  }[role] ?? "bg-muted text-muted-foreground ring-border"
}

export function findRoleByName(roles: Role[], name: string): Role | undefined {
  return roles.find((r) => r.name === name)
}

export function userNap(user: Pick<User, "schools">, schoolId: string): string | null {
  return user.schools?.find((s) => s.id === schoolId)?.pivot?.nap ?? user.schools?.find((s) => s.id === schoolId)?.nap ?? null
}

export function userCities(user: Pick<User, "schools">): string[] {
  return Array.from(
    new Set((user.schools ?? []).map((s) => s.city).filter((c): c is string => Boolean(c)))
  )
}