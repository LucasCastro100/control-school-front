import {
  Calendar,
  CalendarDays,
  KeyRound,
  Package,
  School,
  ShieldCheck,
  Trophy,
  UserRoundCog,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { AuthUser } from "@/lib/types"

export type SidebarContext = {
  schoolId: string | null
  year: number
}

export type SidebarItem = {
  label: string
  icon: LucideIcon
  href: string | ((ctx: SidebarContext) => string)
  isActive?: (pathname: string) => boolean
}

export function resolveHref(item: SidebarItem, ctx: SidebarContext): string {
  return typeof item.href === "function" ? item.href(ctx) : item.href
}

function itemActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0]
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function isSidebarItemActive(item: SidebarItem, pathname: string, ctx: SidebarContext): boolean {
  if (item.isActive) return item.isActive(pathname)
  return itemActive(pathname, resolveHref(item, ctx))
}

const adminMenu: SidebarItem[] = [
  { label: "Escolas", icon: School, href: "/schools" },
  { label: "Usuários", icon: UserRoundCog, href: "/users" },
  { label: "Cargos", icon: ShieldCheck, href: "/roles" },
  { label: "Itens", icon: Package, href: "/items" },
  { label: "TBR", icon: Users, href: "/tbr" },
  { label: "Horário Geral", icon: Calendar, href: "/all-schedules" },
  { label: "Agenda", icon: CalendarDays, href: "/agenda" },
]

export function getMainMenu(user: AuthUser | null): SidebarItem[] {
  if (!user) return []

  switch (user.role) {
    case "orientador":
      return [
        { label: "Minhas Escolas", icon: School, href: "/schools" },
        { label: "Agenda", icon: CalendarDays, href: "/agenda" },
      ]
    case "escola":
      return user.schoolId
        ? [
            {
              label: "Minha Escola",
              icon: School,
              href: `/schools/${user.schoolId}/classes`,
            },
          ]
        : []
    default:
      return adminMenu
  }
}

export function getSchoolActionMenu(ctx: SidebarContext): SidebarItem[] {
  const schoolId = ctx.schoolId
  if (!schoolId) return []

  return [
    {
      label: "Itens",
      icon: Package,
      href: `/items?schoolId=${schoolId}&year=${ctx.year}`,
      isActive: (p) => p === "/items",
    },
    {
      label: "Equipes TBR",
      icon: Trophy,
      href: `/schools/${schoolId}/teams`,
      isActive: (p) => p === `/schools/${schoolId}/teams`,
    },
    {
      label: "Contas de acesso",
      icon: KeyRound,
      href: `/schools/${schoolId}/accounts`,
      isActive: (p) => p === `/schools/${schoolId}/accounts`,
    },
    {
      label: "Horário geral",
      icon: Calendar,
      href: `/schools/${schoolId}/schedules`,
      isActive: (p) => p === `/schools/${schoolId}/schedules`,
    },
  ]
}