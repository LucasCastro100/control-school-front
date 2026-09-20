"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu } from "@base-ui/react/menu"
import { GraduationCap, LogOut, User, ChevronRight } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { logout } from "@/lib/db"
import { cn } from "@/lib/utils"
import {
  getMainMenu,
  getSchoolActionMenu,
  isSidebarItemActive,
  resolveHref,
  type SidebarContext,
  type SidebarItem,
} from "@/lib/sidebar-config"
import type { AuthUser } from "@/lib/types"

function SidebarLinkItem({
  item,
  pathname,
  ctx,
}: {
  item: SidebarItem
  pathname: string
  ctx: SidebarContext
}) {
  const Icon = item.icon
  const isActive = isSidebarItemActive(item, pathname, ctx)
  const href = resolveHref(item, ctx)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} />}
        isActive={isActive}
        tooltip={item.label}
        className="data-active:bg-gradient-to-r data-active:from-primary/30 data-active:via-primary/10 data-active:to-transparent data-active:font-semibold data-active:text-foreground data-active:ring-1 data-active:ring-primary/25"
      >
        <Icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SchoolActionItem({
  item,
  pathname,
  ctx,
}: {
  item: SidebarItem
  pathname: string
  ctx: SidebarContext
}) {
  const Icon = item.icon
  const isActive = isSidebarItemActive(item, pathname, ctx)
  const href = resolveHref(item, ctx)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} />}
        isActive={isActive}
        tooltip={item.label}
        className="hover:bg-sidebar-accent"
      >
        <Icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false)

  const initials = (user?.name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()

  return (
    <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
      <Menu.Trigger
        render={
          <button
            type="button"
            className="flex h-auto w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent data-open:bg-sidebar-accent"
          >
            <span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white ring-1 ring-white/20">
                {initials}
              </span>
            </span>
            <span className="flex flex-1 flex-col overflow-hidden leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold">{user?.name ?? "Usuário"}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user?.email ?? ""}
              </span>
            </span>
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform group-data-[collapsible=icon]:hidden",
                open && "rotate-90"
              )}
            />
          </button>
        }
      />
      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={8} className="z-50">
          <Menu.Popup className="min-w-48 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-primary/5 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Menu.Item
              render={<Link href="/profile" />}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
            >
              <User className="size-4 shrink-0 text-muted-foreground" />
              Meu Perfil
            </Menu.Item>
            <Menu.Item
              render={
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                />
              }
            >
              <LogOut className="size-4 shrink-0 text-muted-foreground" />
              Sair
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export function AppSidebar({ user }: { user: AuthUser | null }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const activeSchoolId =
    pathname.match(/^\/schools\/([^/]+)/)?.[1] ?? searchParams.get("schoolId")

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  const mainItems = useMemo(() => getMainMenu(user), [user])
  const schoolActionItems = useMemo(
    () => getSchoolActionMenu({ schoolId: activeSchoolId, year: currentYear }),
    [activeSchoolId, currentYear]
  )

  return (
    <Sidebar
      collapsible="icon"
      className="[&_[data-sidebar=sidebar]]:bg-sidebar/60 [&_[data-sidebar=sidebar]]:backdrop-blur-xl"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-1 group-data-[collapsible=icon]:justify-center">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-xl bg-primary/50 blur-md" />
                <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                  <GraduationCap className="size-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-base font-semibold tracking-tight whitespace-nowrap">
                  Controle Escolas
                </span>
                <span className="text-[10px] font-medium tracking-[0.25em] text-muted-foreground uppercase">
                  IdeiasDev
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainItems.map((item) => (
                <SidebarLinkItem
                  key={String(item.href)}
                  item={item}
                  pathname={pathname}
                  ctx={{ schoolId: activeSchoolId, year: currentYear }}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {(user?.role === "admin" || user?.role === "orientador") &&
          schoolActionItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Ações da Escola</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {schoolActionItems.map((item) => (
                    <SchoolActionItem
                      key={String(item.href)}
                      item={item}
                      pathname={pathname}
                      ctx={{ schoolId: activeSchoolId, year: currentYear }}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-1">
          {user && <UserMenu user={user} onLogout={handleLogout} />}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}