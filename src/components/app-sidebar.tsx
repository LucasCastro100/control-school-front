"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { School, GraduationCap, LogOut, User, Calendar, Package, UserRoundCog } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { logout } from "@/lib/db"
import type { AuthUser } from "@/lib/types"

const routes = [
  { href: "/schools", label: "Escolas", icon: School },
  { href: "/orientadores", label: "Orientadores", icon: UserRoundCog },
  { href: "/items", label: "Itens", icon: Package },
  { href: "/all-schedules", label: "Horário Geral", icon: Calendar },
]

export function AppSidebar({ user }: { user: AuthUser | null }) {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-1 group-data-[collapsible=icon]:justify-center">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="size-5 text-white" />
              </div>
              <span className="text-base font-semibold whitespace-nowrap group-data-[collapsible=icon]:hidden">
                Controle Escolas
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {routes.map((route) => {
                const Icon = route.icon
                const isActive = pathname.startsWith(route.href)
                return (
                  <SidebarMenuItem key={route.href}>
                    <SidebarMenuButton
                      render={<Link href={route.href} />}
                      isActive={isActive}
                      tooltip={route.label}
                    >
                      <Icon />
                      <span>{route.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 group-data-[collapsible=icon]:justify-center">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                <User className="size-4 text-white" />
              </div>
              <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium leading-tight">
                  {user?.name ?? "Usuário"}
                </p>
                <p className="truncate text-xs text-muted-foreground leading-tight">
                  {user?.email ?? ""}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sair"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
