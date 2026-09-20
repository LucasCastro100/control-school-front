"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, ShieldCheck, LoaderCircle } from "lucide-react"
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
import type { Role } from "@/lib/types"
import { getRoles, createRole, updateRole, deleteRole } from "@/lib/db"
import { AdvisorsSkeleton } from "@/components/skeletons/advisors-skeleton"
import { cn } from "@/lib/utils"

const PERMISSION_OPTIONS = [
  { value: "schools", label: "Escolas" },
  { value: "users", label: "Usuários" },
  { value: "roles", label: "Cargos e Níveis" },
  { value: "items", label: "Itens" },
  { value: "tbr", label: "TBR" },
  { value: "all_schedules", label: "Horário Geral" },
  { value: "agenda", label: "Agenda" },
]

function permissionLabel(value: string): string {
  return PERMISSION_OPTIONS.find((p) => p.value === value)?.label ?? value
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [permissions, setPermissions] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  const { setHeader } = usePageHeader()

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <ShieldCheck className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Cargos e Níveis de acesso</h1>
      </div>,
      <Button size="sm" onClick={() => handleOpenChange(true)}>
        <Plus className="size-4 mr-2" />
        Novo Cargo
      </Button>
    )
  }, [setHeader])

  useEffect(() => {
    async function load() {
      try {
        setRoles(await getRoles())
      } catch {
        toast.error("Não foi possível carregar os cargos.")
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditing(null)
      setName("")
      setPermissions([])
    }
  }

  function handleEdit(role: Role) {
    setEditing(role)
    setName(role.name)
    setPermissions(role.permissions ?? [])
    setOpen(true)
  }

  function togglePermission(value: string) {
    setPermissions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    )
  }

  const canSave = useMemo(() => name.trim().length > 0 && permissions.length > 0, [name, permissions])

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      if (editing) {
        await updateRole(editing.id, { name: name.trim(), permissions })
      } else {
        await createRole({ name: name.trim(), permissions })
      }
      handleOpenChange(false)
      setRoles(await getRoles())
    } catch {
      toast.error("Não foi possível salvar o cargo.")
    }
    setSaving(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    if ((deleteTarget.usersCount ?? 0) > 0) {
      toast.error("Cargo com usuários vinculados não pode ser excluído.")
      setDeleteTarget(null)
      return
    }
    try {
      await deleteRole(deleteTarget.id)
      setRoles(await getRoles())
      toast.success("Cargo excluído com sucesso!")
    } catch {
      toast.error("Não foi possível excluir o cargo.")
    }
    setDeleteTarget(null)
  }

  if (loading) return <AdvisorsSkeleton />

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="role-name">Nome do cargo</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Diretor(a), Coordenador(a)"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Permissões (nível de acesso)</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSION_OPTIONS.map((option) => {
                  const selected = permissions.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePermission(option.value)}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        selected
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-transparent text-muted-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      <span>{option.label}</span>
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full ring-1",
                          selected ? "bg-primary text-primary-foreground ring-primary" : "ring-border"
                        )}
                      >
                        {selected && (
                          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2.5 6.5l2.5 2.5 4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <Button onClick={handleSave} disabled={!canSave || saving}>
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
            Tem certeza que deseja excluir o cargo <strong>{deleteTarget?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex w-full items-center justify-between">
            <CardTitle>Cargos Cadastrados</CardTitle>
            <Button size="sm" onClick={() => handleOpenChange(true)}>
              <Plus className="size-4 mr-2" /> Novo Cargo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhum cargo cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-center">Usuários</TableHead>
                  <TableHead className="w-px">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-1">
                        {(role.permissions ?? []).length === 0 ? (
                          <span className="text-xs text-muted-foreground">-</span>
                        ) : (
                          (role.permissions ?? []).map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center rounded-full bg-white/[0.05] px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-white/10"
                            >
                              {permissionLabel(permission)}
                            </span>
                          ))
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          (role.usersCount ?? 0) > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {role.usersCount ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <ActionTooltip label="Editar cargo">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(role)}>
                            <Pencil className="size-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip label="Excluir cargo">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteTarget(role)}
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