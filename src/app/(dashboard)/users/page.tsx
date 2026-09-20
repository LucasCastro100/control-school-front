"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, UsersRound, LoaderCircle, Eye, EyeOff, Building2 } from "lucide-react"
import { toast } from "sonner"
import { usePageHeader } from "@/lib/page-header"
import { Button } from "@/components/ui/button"
import { ActionTooltip } from "@/components/ui/action-tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { Role, User } from "@/lib/types"
import { getUsers, getRoles, getSchoolsByUser, createUser, updateUser, deleteUser } from "@/lib/db"
import { AdvisorsSkeleton } from "@/components/skeletons/advisors-skeleton"
import {
  USER_ROLE_LABELS,
  roleTint,
  userCities,
} from "@/lib/user-meta"
import { cn } from "@/lib/utils"

const FILTER_ROLE_OPTIONS = [
  { value: "", label: "Todos os níveis" },
  { value: "admin", label: "Administrador" },
  { value: "orientador", label: "Orientador" },
  { value: "professor", label: "Professor" },
  { value: "escola", label: "Acesso à escola" },
]

const BASE_ROLE_ORDER: User["role"][] = ["admin", "orientador", "professor", "escola"]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [schoolCounts, setSchoolCounts] = useState<Record<string, number>>({})
  const [filterRole, setFilterRole] = useState("")
  const [filterCity, setFilterCity] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<User["role"]>("orientador")
  const [roleId, setRoleId] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const { setHeader } = usePageHeader()

  useEffect(() => {
    async function load() {
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()])
      setUsers(usersData)
      setRoles(rolesData)

      const counts: Record<string, number> = {}
      await Promise.all(
        usersData.map(async (u) => {
          counts[u.id] = (await getSchoolsByUser(u.id)).length
        })
      )
      setSchoolCounts(counts)
      setPageLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <UsersRound className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Usuários</h1>
      </div>,
      <Button size="sm" onClick={() => handleOpenChange(true)}>
        <Plus className="size-4 mr-2" />
        Novo Usuário
      </Button>
    )
  }, [setHeader])

  async function refresh() {
    const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()])
    setUsers(usersData)
    setRoles(rolesData)
    const counts: Record<string, number> = {}
    await Promise.all(
      usersData.map(async (u) => {
        counts[u.id] = (await getSchoolsByUser(u.id)).length
      })
    )
    setSchoolCounts(counts)
  }

  const cityOptions = useMemo(() => {
    const cities = new Set<string>()
    for (const u of users) for (const c of userCities(u)) cities.add(c)
    return Array.from(cities).sort((a, b) => a.localeCompare(b))
  }, [users])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole) {
        const matches =
          BASE_ROLE_ORDER.includes(filterRole as User["role"])
            ? u.role === filterRole
            : u.roleData?.name === filterRole
        if (!matches) return false
      }
      if (filterCity) {
        if (!userCities(u).includes(filterCity)) return false
      }
      return true
    })
  }, [users, filterRole, filterCity])

  const roleOptions = useMemo(() => {
    return [
      ...FILTER_ROLE_OPTIONS,
      ...roles
        .filter((r) => !USER_ROLE_LABELS[r.name as User["role"]])
        .map((r) => ({ value: r.name, label: r.name })),
    ]
  }, [roles])

  const cargoOptions = useMemo(() => {
    return [{ value: "", label: "Sem cargo específico" }, ...roles.map((r) => ({ value: r.id, label: r.name }))]
  }, [roles])

  const availableCitiesForRole = useMemo(() => {
    if (!filterRole) return cityOptions
    const filtered = users.filter((u) =>
      BASE_ROLE_ORDER.includes(filterRole as User["role"])
        ? u.role === filterRole
        : u.roleData?.name === filterRole
    )
    const cities = new Set<string>()
    for (const u of filtered) for (const c of userCities(u)) cities.add(c)
    return Array.from(cities).sort((a, b) => a.localeCompare(b))
  }, [users, filterRole, cityOptions])

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditing(null)
      setName("")
      setEmail("")
      setPassword("")
      setRole("orientador")
      setRoleId("")
      setShowPassword(false)
    }
  }

  function handleEdit(user: User) {
    setEditing(user)
    setName(user.name)
    setEmail(user.email)
    setPassword(user.password ?? "")
    setRole(user.role)
    setRoleId(user.roleData?.id ?? "")
    setOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateUser(editing.id, {
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || "mudar123",
          role,
          roleId: roleId || null,
        })
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || "mudar123",
          role,
          roleId: roleId || null,
        })
      }
      handleOpenChange(false)
    } catch {
      toast.error("Não foi possível salvar o usuário.")
    }
    setSaving(false)
    await refresh()
  }

  function handleDelete(id: string, label: string) {
    setDeleteTarget({ id, label })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteUser(deleteTarget.id)
    setDeleteTarget(null)
    await refresh()
    toast.success("Usuário excluído com sucesso!")
  }

  if (pageLoading) return <AdvisorsSkeleton />

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email para login"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha de acesso</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha (padrão: mudar123)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Usada para acessar o sistema. Deixe em branco para usar &quot;mudar123&quot;.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nível de acesso</Label>
                <SearchableSelect
                  options={[
                    ...BASE_ROLE_ORDER.map((r) => ({ value: r, label: USER_ROLE_LABELS[r] })),
                  ]}
                  value={role}
                  onChange={(v) => setRole((v || "orientador") as User["role"])}
                  placeholder="Nível de acesso"
                  searchPlaceholder="Buscar nível..."
                  emptyText="Nenhum nível encontrado."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Cargo (opcional)</Label>
                <SearchableSelect
                  options={cargoOptions}
                  value={roleId}
                  onChange={setRoleId}
                  placeholder="Sem cargo"
                  searchPlaceholder="Buscar cargo..."
                  emptyText="Nenhum cargo encontrado."
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              O nível define o acesso ao sistema. O cargo (ex.: Diretor(a), Coordenador(a)) é um
              complemento informativo.
            </p>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o usuário <strong>{deleteTarget?.label}</strong>? Esta
            ação irá remover o vínculo com escolas associadas.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <SearchableSelect
            options={roleOptions}
            value={filterRole}
            onChange={(v) => {
              setFilterRole(v ?? "")
              setFilterCity("")
            }}
            placeholder="Filtrar por nível"
            searchPlaceholder="Buscar nível..."
            emptyText="Nenhum nível encontrado."
          />
        </div>
        <div className="w-56">
          <SearchableSelect
            options={[
              { value: "", label: "Todas as cidades" },
              ...availableCitiesForRole.map((c) => ({ value: c, label: c })),
            ]}
            value={filterCity}
            onChange={(v) => setFilterCity(v ?? "")}
            placeholder="Filtrar por cidade"
            searchPlaceholder="Buscar cidade..."
            emptyText="Nenhuma cidade encontrada."
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" size="sm" onClick={() => handleOpenChange(true)}>
          <Plus className="size-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cidades</TableHead>
                  <TableHead className="text-center">Qtd Escolas</TableHead>
                  <TableHead className="w-px">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                          roleTint(user.role)
                        )}
                      >
                        {USER_ROLE_LABELS[user.role]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.roleData?.name && user.roleData.name !== USER_ROLE_LABELS[user.role] ? (
                        <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-white/10">
                          {user.roleData.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-1">
                        {userCities(user).length === 0 ? (
                          <span className="text-xs text-muted-foreground">-</span>
                        ) : (
                          userCities(user).map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              <Building2 className="size-3" />
                              {c}
                            </span>
                          ))
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          (schoolCounts[user.id] ?? 0) > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {schoolCounts[user.id] ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <ActionTooltip label="Editar usuário">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(user)}>
                            <Pencil className="size-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip label="Excluir usuário">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(user.id, user.name)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </ActionTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}