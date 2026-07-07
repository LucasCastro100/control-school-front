"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { School, GraduationCap, LogOut, User, Calendar, Package, UserRoundCog, Users, Save, Upload, Download, Database, ChevronDown } from "lucide-react"
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
import { toast } from "sonner"
import { logout, exportStorageData, importStorageData } from "@/lib/db"
import type { AuthUser } from "@/lib/types"

const routes = [
  { href: "/schools", label: "Escolas", icon: School },
  { href: "/advisors", label: "Orientadores", icon: UserRoundCog },
  { href: "/items", label: "Itens", icon: Package },
  { href: "/tbr", label: "TBR", icon: Users },
  { href: "/all-schedules", label: "Horário Geral", icon: Calendar },
]

export function AppSidebar({ user }: { user: AuthUser | null }) {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push("/login")
  }

  const [saving, setSaving] = useState(false)
  const [dataOpen, setDataOpen] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const data = exportStorageData()
      const res = await fetch("/api/seed-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success("Dados salvos em seed.json com sucesso!")
      } else {
        toast.error("Erro ao salvar dados.")
      }
    } catch {
      toast.error("Erro ao conectar com o servidor.")
    } finally {
      setSaving(false)
    }
  }

  function handleExport() {
    const data = exportStorageData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "seed-data.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        importStorageData(data)
        router.refresh()
        window.location.reload()
      } catch {
        toast.error("Erro ao importar: arquivo inválido.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
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
              {user?.email === "admin@gmail.com" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setDataOpen(!dataOpen)}
                    tooltip="Dados"
                  >
                    <Database />
                    <span>Dados</span>
                    <ChevronDown className={`ml-auto size-3 transition-transform ${dataOpen ? "rotate-0" : "-rotate-90"}`} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {user?.email === "admin@gmail.com" && dataOpen && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleSave}
                      disabled={saving}
                      tooltip="Salvar no seed.json"
                    >
                      <Save />
                      <span>{saving ? "Salvando..." : "Salvar no seed.json"}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleExport}
                      tooltip="Exportar JSON"
                    >
                      <Download />
                      <span>Exportar JSON</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => document.getElementById("import-json-input")?.click()}
                      tooltip="Importar JSON"
                    >
                      <Upload />
                      <span>Importar JSON</span>
                    </SidebarMenuButton>
                    <input
                      id="import-json-input"
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </SidebarMenuItem>
                </>
              )}
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
