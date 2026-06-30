"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Plus, Pencil, Trash2, DoorOpen, Calendar, GraduationCap, Package } from "lucide-react"
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
import type { Class, School, Item, NapItem } from "@/lib/types"
import {
  getSchool,
  getClassesBySchool,
  createClass,
  updateClass,
  deleteClass,
  getRoomsByClass,
  getStudentsByRoom,
  getAllItems,
  getNapItems,
  upsertNapItem,
  deleteNapItem,
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
  const [open, setOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [segmento, setSegmento] = useState("")
  const [year, setYear] = useState("")
  const [name, setName] = useState("")
  const [classStats, setClassStats] = useState<
    Record<string, { rooms: number; students: number; biggestRoom: string }>
  >({})
  const [items, setItems] = useState<Item[]>([])
  const [napItems, setNapItems] = useState<NapItem[]>([])
  const [itemDialog, setItemDialog] = useState(false)
  const [itemSegName, setItemSegName] = useState("")
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({})
  const { setHeader } = usePageHeader()

  useEffect(() => {
    setSchool(getSchool(id) ?? null)
    setItems(getAllItems())
    setNapItems(getNapItems(id))
    loadData()
  }, [id])

  function loadData() {
    const classList = getClassesBySchool(id)
    setClasses(classList)

    const stats: Record<string, { rooms: number; students: number; biggestRoom: string }> = {}
    for (const cls of classList) {
      const rooms = getRoomsByClass(cls.id)
      let students = 0
      let biggest = ""
      let biggestCount = 0
      for (const room of rooms) {
        const count = getStudentsByRoom(room.id).length
        students += count
        if (count > biggestCount) {
          biggestCount = count
          biggest = `${room.name} (${count})`
        }
      }
      stats[cls.id] = { rooms: rooms.length, students, biggestRoom: biggest || "-" }
    }
    setClassStats(stats)
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
        <Link href={"/items?schoolId=" + id}>
          <Button variant="outline" size="sm" className="gap-2">
            <Package className="size-4" />
            Itens
          </Button>
        </Link>
        <Link href={"/schools/" + id + "/schedules"}>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="size-4" />
            Horários Gerais
          </Button>
        </Link>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-2" />
          Nova Turma
        </Button>
      </div>
    )
  }, [school?.name, id])

  function refresh() {
    loadData()
    router.refresh()
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingClass(null)
      setSegmento("")
      setYear("")
      setName("")
    }
  }

  function handleSegmentoChange(value: string) {
    setSegmento(value)
    setYear("")
    setName("")
  }

  function handleYearChange(value: string) {
    setYear(value)
    if (value) {
      setName(value)
    }
  }

  function handleEdit(cls: Class) {
    setEditingClass(cls)
    setSegmento(cls.nap)
    setYear("")
    setName(cls.name)
    setOpen(true)
  }

  function handleSave() {
    if (!segmento || !name.trim()) return
    if (editingClass) {
      updateClass(editingClass.id, { nap: segmento, name: name.trim() })
    } else {
      createClass({ schoolId: id, nap: segmento, name: name.trim() })
    }
    handleOpenChange(false)
    refresh()
  }

  function handleDelete(classId: string) {
    if (confirm("Tem certeza que deseja excluir esta turma?")) {
      deleteClass(classId)
      refresh()
    }
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

  function handleSaveItems() {
    for (const itemId of Object.keys(itemQuantities)) {
      const qty = parseInt(itemQuantities[itemId]) || 0
      if (qty > 0) {
        upsertNapItem(id, itemSegName, itemId, qty)
      } else {
        const existing = napItems.find(
          (n) => n.segmentName === itemSegName && n.itemId === itemId
        )
        if (existing) deleteNapItem(existing.id)
      }
    }
    setNapItems(getNapItems(id))
    setItemDialog(false)
  }

  const yearOptions = segmento
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
                options={yearOptions}
                value={year}
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
            <Button onClick={handleSave}>
              {editingClass ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Itens - {itemSegName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
            {(() => {
              const filtered = items.filter((i) => i.naps.includes(itemSegName))
              if (filtered.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum item vinculado a {itemSegName}. Cadastre itens com este NAP em "Itens".
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
            <Button onClick={handleSaveItems}>Salvar</Button>
          )}
        </DialogContent>
      </Dialog>

      {segmentoGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma turma cadastrada.
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
                          {stats?.rooms ?? 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {stats?.students ?? 0}
                        </TableCell>
                        <TableCell>{stats?.biggestRoom ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Link
                              href={"/schools/" + id + "/classes/" + cls.id + "/rooms"}
                            >
                              <Button variant="outline" size="icon" className="size-8">
                                <DoorOpen className="size-3.5" />
                              </Button>
                            </Link>
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
                              onClick={() => handleDelete(cls.id)}
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
