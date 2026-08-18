"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, UserRoundCog, LoaderCircle } from "lucide-react"
import { usePageHeader } from "@/lib/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { User } from "@/lib/types"
import {
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/db"
import { supabase } from "@/lib/supabase"

export default function OrientadoresPage() {
  const [orientadores, setOrientadores] = useState<User[]>([])
  const [schoolCounts, setSchoolCounts] = useState<Record<string, number>>({})
  const [open, setOpen] = useState(false)
  const [editingOrientador, setEditingOrientador] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { setHeader } = usePageHeader()

  useEffect(() => {
    async function load() {
      const orientadoresData = await getUsersByRole("orientador")
      setOrientadores(orientadoresData)
      const { data: links } = await supabase.from("user_schools").select("user_id")
      const counts: Record<string, number> = {}
      for (const link of links ?? []) {
        counts[link.user_id] = (counts[link.user_id] ?? 0) + 1
      }
      setSchoolCounts(counts)
    }
    load()
  }, [])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <UserRoundCog className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Orientadores</h1>
      </div>,
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-2" />
        Novo Orientador
      </Button>
    )
  }, [])

  async function refresh() {
    const orientadoresData = await getUsersByRole("orientador")
    setOrientadores(orientadoresData)
    const { data: links } = await supabase.from("user_schools").select("user_id")
    const counts: Record<string, number> = {}
    for (const link of links ?? []) {
      counts[link.user_id] = (counts[link.user_id] ?? 0) + 1
    }
    setSchoolCounts(counts)
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingOrientador(null)
      setName("")
      setEmail("")
      setPassword("")
    }
  }

  async function handleEdit(orientador: User) {
    setEditingOrientador(orientador)
    setName(orientador.name)
    setEmail(orientador.email)
    setPassword(orientador.password ?? "")
    setOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    if (editingOrientador) {
      await updateUser(editingOrientador.id, {
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || "mudar123",
      })
    } else {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || "mudar123",
        role: "orientador",
      })
    }
    handleOpenChange(false)
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
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingOrientador ? "Editar Orientador" : "Novo Orientador"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do orientador"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email do orientador"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha de acesso</Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (padrão: mudar123)"
              />
              <p className="text-xs text-muted-foreground">
                Usada pelo orientador para acessar o sistema. Deixe em branco para usar &quot;mudar123&quot;.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {editingOrientador ? "Salvar" : "Criar"}
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
            Tem certeza que deseja excluir o orientador <strong>{deleteTarget?.label}</strong>?
            Esta ação irá remover o vínculo com escolas associadas.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Orientadores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {orientadores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum orientador cadastrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Qtd Escolas</TableHead>
                  <TableHead className="w-px">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orientadores.map((orientador) => (
                  <TableRow key={orientador.id}>
                    <TableCell className="font-medium">
                      {orientador.name || "-"}
                    </TableCell>
                    <TableCell>{orientador.email || "-"}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          (schoolCounts[orientador.id] ?? 0) > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {schoolCounts[orientador.id] ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(orientador)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(orientador.id, orientador.name)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
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
