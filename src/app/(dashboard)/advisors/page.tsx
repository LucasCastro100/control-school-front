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
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { Orientador } from "@/lib/types"
import {
  getOrientadores,
  createOrientador,
  updateOrientador,
  deleteOrientador,
} from "@/lib/db"
import { REGIONS } from "@/lib/brazil-data"
import { fetchStatesByRegion, fetchCitiesByState } from "@/lib/ibge-api"

export default function OrientadoresPage() {
  const [orientadores, setOrientadores] = useState<Orientador[]>([])
  const [open, setOpen] = useState(false)
  const [editingOrientador, setEditingOrientador] = useState<Orientador | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [region, setRegion] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")

  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([])
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const { setHeader } = usePageHeader()

  useEffect(() => {
    setOrientadores(getOrientadores())
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

  function refresh() {
    setOrientadores(getOrientadores())
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingOrientador(null)
      setName("")
      setEmail("")
      setRegion("")
      setState("")
      setCity("")
      setStateOptions([])
      setCityOptions([])
    }
  }

  function handleRegionChange(value: string) {
    setRegion(value)
    setState("")
    setCity("")
    setCityOptions([])
    if (!value) {
      setStateOptions([])
      return
    }
    setLoadingStates(true)
    fetchStatesByRegion(value)
      .then((data) =>
        setStateOptions(
          data.map((s) => ({ value: s.sigla, label: `${s.sigla} - ${s.nome}` }))
        )
      )
      .catch(() => setStateOptions([]))
      .finally(() => setLoadingStates(false))
  }

  function handleStateChange(value: string) {
    setState(value)
    setCity("")
    if (!value) {
      setCityOptions([])
      return
    }
    setLoadingCities(true)
    fetchCitiesByState(value)
      .then((data) =>
        setCityOptions(data.map((c) => ({ value: c.nome, label: c.nome })))
      )
      .catch(() => setCityOptions([]))
      .finally(() => setLoadingCities(false))
  }

  async function handleEdit(orientador: Orientador) {
    setEditingOrientador(orientador)
    setName(orientador.name)
    setEmail(orientador.email)
    setOpen(true)

    setLoadingStates(true)
    try {
      const data = await fetchStatesByRegion(orientador.region)
      const mapped = data.map((s) => ({
        value: s.sigla,
        label: `${s.sigla} - ${s.nome}`,
      }))
      setStateOptions(mapped)
      setRegion(orientador.region)
      setState(orientador.state)
    } catch {
      setStateOptions([])
    } finally {
      setLoadingStates(false)
    }

    setLoadingCities(true)
    try {
      const data = await fetchCitiesByState(orientador.state)
      setCityOptions(data.map((c) => ({ value: c.nome, label: c.nome })))
      setCity(orientador.city)
    } catch {
      setCityOptions([])
    } finally {
      setLoadingCities(false)
    }
  }

  function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setTimeout(() => {
      if (editingOrientador) {
        updateOrientador(editingOrientador.id, {
          name: name.trim(),
          email: email.trim(),
          region,
          state,
          city,
        })
      } else {
        createOrientador({
          name: name.trim(),
          email: email.trim(),
          region,
          state,
          city,
        })
      }
      handleOpenChange(false)
      setSaving(false)
      refresh()
    }, 0)
  }

  function handleDelete(id: string, label: string) {
    setDeleteTarget({ id, label })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteOrientador(deleteTarget.id)
    setDeleteTarget(null)
    refresh()
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
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Região</Label>
                <SearchableSelect
                  options={REGIONS.map((r) => ({ value: r, label: r }))}
                  value={region}
                  onChange={handleRegionChange}
                  placeholder="Região"
                  searchPlaceholder="Buscar região..."
                  emptyText="Nenhuma região encontrada."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Estado</Label>
                <SearchableSelect
                  options={stateOptions}
                  value={state}
                  onChange={handleStateChange}
                  placeholder="Estado"
                  searchPlaceholder="Buscar estado..."
                  emptyText="Nenhum estado encontrado."
                  loading={loadingStates}
                  disabled={!region}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Município</Label>
                <SearchableSelect
                  options={cityOptions}
                  value={city}
                  onChange={setCity}
                  placeholder="Município"
                  searchPlaceholder="Buscar município..."
                  emptyText="Nenhum município encontrado."
                  loading={loadingCities}
                  disabled={!state}
                />
              </div>
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
                  <TableHead>Estado</TableHead>
                  <TableHead>Município</TableHead>
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
                    <TableCell>{orientador.state || "-"}</TableCell>
                    <TableCell>{orientador.city || "-"}</TableCell>
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
