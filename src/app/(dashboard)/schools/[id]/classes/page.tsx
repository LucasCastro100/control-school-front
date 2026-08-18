"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Plus, Pencil, Trash2, DoorOpen, Calendar, GraduationCap, Package, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { usePageHeader } from "@/lib/page-header"
import type { Class, School, Item, NapItem, Room } from "@/lib/types"
import {
  getSchool,
  getClassesBySchoolAndYear,
  createClass,
  updateClass,
  deleteClass,
  getRoomsByClass,
  createRoom,
  deleteRoom,
  getAllItems,
  getNapItems,
  getNapItemsBySchoolAndYear,
  upsertNapItem,
  deleteNapItem,
  getAcademicYears,
} from "@/lib/db"

interface YearOption {
  id: number
  name: string
}

const SEGMENTO_YEARS: Record<string, YearOption[]> = {
  "NAP 1": [
    { id: 1, name: "Infantil 3 anos" },
    { id: 2, name: "Infantil 4 anos" },
    { id: 3, name: "Infantil 5 anos" },
    { id: 4, name: "1 ano" },
  ],
  "NAP 2": [
    { id: 5, name: "2 ano" },
    { id: 6, name: "3 ano" },
    { id: 7, name: "4 ano" },
    { id: 8, name: "5 ano" },
  ],
  "NAP 3": [
    { id: 9, name: "6 ano" },
    { id: 10, name: "7 ano" },
    { id: 11, name: "8 ano" },
    { id: 12, name: "9 ano" },
  ],
  "NAP 4": [
    { id: 13, name: "1 ano ensino médio" },
    { id: 14, name: "2 ano ensino médio" },
    { id: 15, name: "3 ano ensino médio" },
  ],
}

const SEGMENTO_OPTIONS = Object.keys(SEGMENTO_YEARS).map((n) => ({ value: n, label: n }))

export default function ClassesPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const [school, setSchool] = useState<School | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [segmento, setSegmento] = useState("")
  const [classYear, setClassYear] = useState("")
  const [name, setName] = useState("")
  const [classStats, setClassStats] = useState<
    Record<string, { rooms: number; students: number; biggestRoom: string }>
  >({})
  const [items, setItems] = useState<Item[]>([])
  const [napItems, setNapItems] = useState<NapItem[]>([])
  const [saving, setSaving] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [itemDialog, setItemDialog] = useState(false)
  const [itemSegName, setItemSegName] = useState("")
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({})
  const [roomsDialog, setRoomsDialog] = useState(false)
  const [roomsTarget, setRoomsTarget] = useState<Class | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomName, setRoomName] = useState("")
  const [roomStudentCount, setRoomStudentCount] = useState(0)
  const [addingRoom, setAddingRoom] = useState(false)
  const [roomDeleteTarget, setRoomDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [academicYears, setAcademicYears] = useState<string[]>([])
  const { setHeader } = usePageHeader()

  useEffect(() => {
    async function init() {
      const years = await getAcademicYears()
      setAcademicYears(years)
      const s = await getSchool(id)
      setSchool(s ?? null)
      const allItems = await getAllItems()
      setItems(allItems)
      setAvailableYears(years)
      if (!years.includes(filterYear)) {
        setFilterYear(years[0] || String(new Date().getFullYear()))
      }
    }
    init()
  }, [id])

  useEffect(() => {
    loadData()
  }, [filterYear])

  async function loadData() {
    const classList = await getClassesBySchoolAndYear(id, filterYear)
    setClasses(classList)

    const stats: Record<string, { rooms: number; students: number; biggestRoom: string }> = {}
    for (const cls of classList) {
      const classRooms = await getRoomsByClass(cls.id)
      let students = 0
      let biggest = ""
      let biggestCount = 0
      for (const room of classRooms) {
        const count = room.studentCount ?? 0
        students += count
        if (count > biggestCount) {
          biggestCount = count
          biggest = `${room.name} (${count})`
        }
      }
      stats[cls.id] = { rooms: classRooms.length, students, biggestRoom: biggest || "-" }
    }
    setClassStats(stats)
    setNapItems(await getNapItemsBySchoolAndYear(id, filterYear))
  }

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <GraduationCap className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Turmas - {school?.name}</h1>
      </div>,
      <div className="flex items-center gap-2">
        <Link href={"/items?schoolId=" + id + "&year=" + filterYear}>
          <Button variant="outline" size="sm" className="gap-2">
            <Package className="size-4" />
            Items
          </Button>
        </Link>
        <Link href={"/schools/" + id + "/schedules?year=" + filterYear}>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="size-4" />
            General Schedules
          </Button>
        </Link>
        <Button size="sm" onClick={() => {
          setClassYear(filterYear)
          setOpen(true)
        }}>
          <Plus className="size-4 mr-2" />
          Nova Turma
        </Button>
      </div>
    )
  }, [school?.name, id, filterYear])

  async function refresh() {
    await loadData()
    router.refresh()
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingClass(null)
      setSegmento("")
      setClassYear("")
      setName("")
    }
  }

  function handleSegmentoChange(value: string) {
    setSegmento(value)
    setClassYear("")
    setName("")
  }

  function handleYearChange(value: string) {
    setClassYear(value)
    if (value) {
      setName(value)
    }
  }

  function handleEdit(cls: Class) {
    setEditingClass(cls)
    setSegmento(cls.nap)
    setClassYear(filterYear)
    setName(cls.name)
    setOpen(true)
  }

  async function handleSave(closeAfter: boolean) {
    if (!segmento || !name.trim()) return
    const yearValue = editingClass ? editingClass.year : filterYear
    if (!yearValue) return
    setSaving(true)
    if (editingClass) {
      await updateClass(editingClass.id, { nap: segmento, name: name.trim() })
    } else {
      await createClass({ schoolId: id, nap: segmento, name: name.trim(), year: yearValue })
    }
    setSaving(false)
    await refresh()
    if (closeAfter) {
      handleOpenChange(false)
    } else {
      setSegmento("")
      setClassYear("")
      setName("")
    }
  }

  function handleDelete(classId: string, label: string) {
    setDeleteTarget({ id: classId, label })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteClass(deleteTarget.id)
    setDeleteTarget(null)
    await refresh()
  }

  function openItemDialog(segName: string) {
    const segNapItems = napItems.filter((n) => n.segmentName === segName)
    const qtyMap: Record<string, string> = {}
    for (const item of items) {
      const ni = segNapItems.find((n) => n.itemId === item.id)
      qtyMap[item.id] = ni ? String(ni.quantity) : "0"
    }
    setItemSegName(segName)
    setItemQuantities(qtyMap)
    setItemDialog(true)
  }

  async function openRoomsDialog(cls: Class) {
    setRoomsTarget(cls)
    const classRooms = await getRoomsByClass(cls.id)
    setRooms(classRooms)
    setRoomName("")
    setRoomStudentCount(0)
    setRoomsDialog(true)
  }

  async function handleAddRoom(closeAfter: boolean) {
    if (!roomsTarget || !roomName.trim()) return
    setAddingRoom(true)
    await createRoom({ classId: roomsTarget.id, name: roomName.trim(), studentCount: roomStudentCount })
    const classRooms = await getRoomsByClass(roomsTarget.id)
    setRooms(classRooms)
    setRoomName("")
    setRoomStudentCount(0)
    setAddingRoom(false)
    await refresh()
    if (closeAfter) {
      setRoomsDialog(false)
    }
  }

  async function confirmRoomDelete() {
    if (!roomDeleteTarget) return
    await deleteRoom(roomDeleteTarget.id)
    setRoomDeleteTarget(null)
    if (roomsTarget) {
      const classRooms = await getRoomsByClass(roomsTarget.id)
      setRooms(classRooms)
    }
    await refresh()
  }

  async function handleSaveItems() {
    setSavingItems(true)
    for (const itemId of Object.keys(itemQuantities)) {
      const qty = parseInt(itemQuantities[itemId]) || 0
      if (qty > 0) {
        await upsertNapItem(id, itemSegName, itemId, qty, filterYear)
      } else {
        const existing = napItems.find(
          (n) => n.segmentName === itemSegName && n.itemId === itemId
        )
        if (existing) await deleteNapItem(existing.id)
      }
    }
    setNapItems(await getNapItemsBySchoolAndYear(id, filterYear))
    setSavingItems(false)
    setItemDialog(false)
  }

  const segmentYearOptions = segmento
    ? SEGMENTO_YEARS[segmento].map((y) => ({ value: y.name, label: y.name }))
    : []

  function sortClassesByYear(napKey: string, classList: Class[]): Class[] {
    const years = SEGMENTO_YEARS[napKey] ?? []
    return [...classList].sort((a, b) => {
      const aIdx = years.findIndex((y) => a.name.startsWith(y.name))
      const bIdx = years.findIndex((y) => b.name.startsWith(y.name))
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
    })
  }

  const segmentoGroups = ["NAP 1", "NAP 2", "NAP 3", "NAP 4"]
    .map((s) => ({
      segmento: s,
      classes: sortClassesByYear(s, classes.filter((c) => c.nap === s)),
    }))
    .filter((g) => g.classes.length > 0)

  const otherClasses = classes.filter(
    (c) => !["NAP 1", "NAP 2", "NAP 3", "NAP 4"].includes(c.nap)
  )
  if (otherClasses.length > 0) {
    segmentoGroups.push({ segmento: "Outros", classes: otherClasses })
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/schools"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Escolas
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">{school?.name}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Ano Letivo:</Label>
          <SearchableSelect
            options={availableYears.map((y) => ({ value: y, label: y }))}
            value={filterYear}
            onChange={(v) => v && setFilterYear(v)}
            placeholder="Selecione o ano"
            searchPlaceholder="Buscar ano..."
            emptyText="Nenhum ano encontrado."
          />
        </div>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Editar Turma" : "Nova Turma"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>NAP</Label>
              <SearchableSelect
                options={SEGMENTO_OPTIONS}
                value={segmento}
                onChange={handleSegmentoChange}
                placeholder="Selecione o NAP"
                searchPlaceholder="Buscar NAP..."
                emptyText="Nenhum NAP encontrado."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Ano</Label>
              <SearchableSelect
                options={segmentYearOptions}
                value={classYear}
                onChange={handleYearChange}
                placeholder="Selecione o ano"
                searchPlaceholder="Buscar ano..."
                emptyText="Nenhum ano encontrado."
                disabled={!segmento}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Identificador da Turma</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: 1 Ano A"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleSave(true)} disabled={saving}>
                {saving && <LoaderCircle className="size-4 animate-spin" />}
                {editingClass ? "Salvar" : "Criar"}
              </Button>
              {!editingClass && (
                <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                  Criar e adicionar outra
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Itens - {itemSegName} ({filterYear})</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
            {(() => {
              const filtered = items.filter((i) => i.naps.includes(itemSegName))
              if (filtered.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum item vinculado a {itemSegName}. Cadastre itens com este NAP em &quot;Itens&quot;.
                  </p>
                )
              }
              return filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.category === "tapete"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    }`}>
                      {item.category === "tapete" ? "Tapete" : "Tecnologia"}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      className="w-20 h-8 text-center"
                      value={itemQuantities[item.id] ?? "0"}
                      onChange={(e) =>
                        setItemQuantities((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                    <span className="text-xs text-muted-foreground w-8">un.</span>
                  </div>
                </div>
              ))
            })()}
          </div>
          {items.length > 0 && (
            <Button onClick={handleSaveItems} disabled={savingItems}>
              {savingItems && <LoaderCircle className="size-4 animate-spin" />}
              Salvar
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a turma <strong>{deleteTarget?.label}</strong>?
            Esta ação irá remover também salas e horários vinculados.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roomsDialog} onOpenChange={setRoomsDialog}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              Salas - {roomsTarget?.name} {roomsTarget?.year ? `(${roomsTarget.year})` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma sala cadastrada.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{room.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {room.studentCount ?? 0} alunos
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="size-8"
                      onClick={() => setRoomDeleteTarget({ id: room.id, label: room.name })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 border-t pt-4">
              <Label>Nova Sala</Label>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: 1A, 1B"
              />
              <Input
                type="number"
                min="0"
                value={roomStudentCount || ""}
                onChange={(e) => setRoomStudentCount(Number(e.target.value))}
                placeholder="Quantidade de alunos"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddRoom(true)}
                  disabled={addingRoom || !roomName.trim()}
                >
                  {addingRoom && <LoaderCircle className="size-4 animate-spin" />}
                  Adicionar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAddRoom(false)}
                  disabled={addingRoom || !roomName.trim()}
                >
                  Adicionar e adicionar outra
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roomDeleteTarget} onOpenChange={(open) => !open && setRoomDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a sala <strong>{roomDeleteTarget?.label}</strong>?
            Esta ação irá remover também os horários vinculados.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRoomDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmRoomDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {segmentoGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma turma cadastrada para {filterYear}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Segmento</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="text-center w-20">Ano Letivo</TableHead>
                  <TableHead className="text-center w-24">Qtd Salas</TableHead>
                  <TableHead className="text-center w-24">Total Alunos</TableHead>
                  <TableHead>Maior Sala</TableHead>
                  <TableHead className="w-44">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segmentoGroups.map(({ segmento: groupSeg, classes: groupClasses }) =>
                  groupClasses.map((cls, i) => {
                    const stats = classStats[cls.id]
                    const segNapItems = napItems.filter((n) => n.segmentName === groupSeg)
                    const tapeteCount = segNapItems.reduce((sum, n) => {
                      const item = items.find((it) => it.id === n.itemId)
                      return item?.category === "tapete" ? sum + n.quantity : sum
                    }, 0)
                    const tecCount = segNapItems.reduce((sum, n) => {
                      const item = items.find((it) => it.id === n.itemId)
                      return item?.category === "tecnologia" ? sum + n.quantity : sum
                    }, 0)
                    return (
                      <TableRow key={cls.id} className={"align-top" + (i === groupClasses.length - 1 ? " border-b-2" : "")}>
                        {i === 0 && (
                          <TableCell
                            rowSpan={groupClasses.length}
                            className="font-semibold text-muted-foreground align-middle text-center"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span>{groupSeg}</span>
                              <button
                                onClick={() => openItemDialog(groupSeg)}
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Package className="size-3" />
                                {tapeteCount} tapetes, {tecCount} tecnologias
                              </button>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {cls.name || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {cls.year}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {stats?.rooms ?? 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {stats?.students ?? 0}
                        </TableCell>
                        <TableCell>{stats?.biggestRoom ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8"
                              onClick={() => openRoomsDialog(cls)}
                            >
                              <DoorOpen className="size-3.5" />
                            </Button>
                            <Link
                              href={"/schools/" + id + "/classes/" + cls.id + "/schedules"}
                            >
                              <Button variant="outline" size="icon" className="size-8">
                                <Calendar className="size-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8"
                              onClick={() => handleEdit(cls)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="size-8"
                              onClick={() => handleDelete(cls.id, cls.name)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
