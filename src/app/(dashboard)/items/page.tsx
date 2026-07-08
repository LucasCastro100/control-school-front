"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus, Pencil, Trash2, Package, X, LoaderCircle } from "lucide-react"
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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { usePageHeader } from "@/lib/page-header"
import type { Item, School, NapItem } from "@/lib/types"
import {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  getSchools,
  getSchoolsByYear,
  getNapItems,
  getNapItemsBySchoolAndYear,
  getAllNapItems,
  getAcademicYears,
} from "@/lib/db"

const CATEGORY_OPTIONS = [
  { value: "tapete", label: "Tapete" },
  { value: "tecnologia", label: "Tecnologia" },
]

const ALL_NAPS = ["NAP 1", "NAP 2", "NAP 3", "NAP 4"]

const NAP_OPTIONS = [
  { value: "", label: "Todos os NAPs" },
  ...ALL_NAPS.map((n) => ({ value: n, label: n })),
]

export default function ItemsPage() {
  return (
    <Suspense fallback={null}>
      <ItemsContent />
    </Suspense>
  )
}

function ItemsContent() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [allNapItems, setAllNapItems] = useState<NapItem[]>([])
  const [globalNapItems, setGlobalNapItems] = useState<NapItem[]>([])
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [itemName, setItemName] = useState("")
  const [itemCategory, setItemCategory] = useState("")
  const [itemNaps, setItemNaps] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [filterYear, setFilterYear] = useState(searchParams.get("year") || String(new Date().getFullYear()))
  const [filterSchoolId, setFilterSchoolId] = useState(searchParams.get("schoolId") || "")
  const [filterNap, setFilterNap] = useState("")
  const { setHeader } = usePageHeader()

  const academicYears = getAcademicYears()

  useEffect(() => {
    setItems(getAllItems())
    setSchools(getSchools())
    setGlobalNapItems(getAllNapItems())
    const sId = searchParams.get("schoolId")
    if (sId) setFilterSchoolId(sId)
    const y = searchParams.get("year")
    if (y) setFilterYear(y)
  }, [])

  useEffect(() => {
    if (filterSchoolId) {
      setAllNapItems(getNapItemsBySchoolAndYear(filterSchoolId, filterYear))
    } else {
      setAllNapItems([])
    }
  }, [filterSchoolId, filterYear])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <Package className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Itens</h1>
      </div>,
      <Button size="sm" onClick={() => {
        setEditingItem(null)
        setItemName("")
        setItemCategory("")
        setItemNaps([])
        setOpen(true)
      }}>
        <Plus className="size-4 mr-2" />
        Novo Item
      </Button>
    )
  }, [])

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingItem(null)
      setItemName("")
      setItemCategory("")
      setItemNaps([])
    }
  }

  function handleEdit(item: Item) {
    setEditingItem(item)
    setItemName(item.name)
    setItemCategory(item.category)
    setItemNaps(item.naps || [])
    setOpen(true)
  }

  function handleSave() {
    if (!itemName.trim() || !itemCategory) return
    setSaving(true)
    setTimeout(() => {
      if (editingItem) {
        updateItem(editingItem.id, { name: itemName.trim(), category: itemCategory as "tapete" | "tecnologia", naps: itemNaps })
      } else {
        createItem({ name: itemName.trim(), category: itemCategory as "tapete" | "tecnologia", naps: itemNaps })
      }
      handleOpenChange(false)
      setSaving(false)
      setItems(getAllItems())
    }, 0)
  }

  function handleDelete(itemId: string, label: string) {
    setDeleteTarget({ id: itemId, label })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteItem(deleteTarget.id)
    setDeleteTarget(null)
    setItems(getAllItems())
  }

  function toggleNap(nap: string) {
    setItemNaps((prev) =>
      prev.includes(nap) ? prev.filter((n) => n !== nap) : [...prev, nap]
    )
  }

  const filteredNapItems = filterNap
    ? allNapItems.filter((n) => n.segmentName === filterNap)
    : allNapItems

  const assignedItemIds = new Set(filteredNapItems.map((n) => n.itemId))

  const displayedItems = filterSchoolId && filterNap
    ? items.filter((i) => assignedItemIds.has(i.id))
    : items

  const schoolOptions = [
    { value: "", label: "Selecione uma escola" },
    ...schools.map((s) => ({ value: s.id, label: s.name })),
  ]

  function totalSchools(itemId: string): number {
    return new Set(globalNapItems.filter((n) => n.itemId === itemId).map((n) => n.schoolId)).size
  }

  function getQty(itemId: string): number {
    return filteredNapItems
      .filter((n) => n.itemId === itemId)
      .reduce((s, n) => s + n.quantity, 0)
  }

  const tapetes = displayedItems.filter((i) => i.category === "tapete")
  const tecnologias = displayedItems.filter((i) => i.category === "tecnologia")

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nome</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ex: Tapete EVA, Kit Robótica"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <SearchableSelect
                options={CATEGORY_OPTIONS}
                value={itemCategory}
                onChange={setItemCategory}
                placeholder="Selecione a categoria"
                searchPlaceholder="Buscar categoria..."
                emptyText="Nenhuma categoria encontrada."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>NAPs</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_NAPS.map((nap) => (
                  <button
                    key={nap}
                    type="button"
                    onClick={() => toggleNap(nap)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      itemNaps.includes(nap)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {nap}
                    {itemNaps.includes(nap) && <X className="size-3" />}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {editingItem ? "Salvar" : "Criar"}
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
            Tem certeza que deseja excluir o item <strong>{deleteTarget?.label}</strong>?
            Esta ação irá remover também os vínculos com escolas.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Ano:</Label>
          <SearchableSelect
            options={academicYears.map((y) => ({ value: y, label: y }))}
            value={filterYear}
            onChange={(v) => {
              if (v) {
                setFilterYear(v)
                setFilterSchoolId("")
              }
            }}
            placeholder="Selecione o ano"
            searchPlaceholder="Buscar ano..."
            emptyText="Nenhum ano encontrado."
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Escola:</Label>
          <SearchableSelect
            options={schoolOptions}
            value={filterSchoolId}
            onChange={setFilterSchoolId}
            placeholder="Selecione uma escola"
            searchPlaceholder="Buscar escola..."
            emptyText="Nenhuma escola encontrada."
          />
        </div>
        {filterSchoolId && (
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">NAP:</Label>
            <SearchableSelect
              options={NAP_OPTIONS}
              value={filterNap}
              onChange={setFilterNap}
              placeholder="Filtrar por NAP"
              searchPlaceholder="Buscar NAP..."
              emptyText="Nenhum NAP encontrado."
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b font-medium text-sm text-muted-foreground">Tapetes</div>
            {tapetes.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {filterSchoolId && filterNap
                  ? "Nenhum tapete vinculado a este NAP."
                  : "Nenhum tapete cadastrado."}
              </div>
            ) : (
              tapetes.map((item) => {
                const qty = getQty(item.id)
                const schoolsCount = totalSchools(item.id)
                return (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2 border-b last:border-b-0">
                    <div>
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex gap-1 mt-0.5">
                        {(item.naps || []).map((nap) => (
                          <span key={nap} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {nap}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {schoolsCount} escola{schoolsCount !== 1 ? "s" : ""}
                        {filterSchoolId && filterNap && ` — ${qty} un.`}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="size-7" onClick={() => handleEdit(item)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="destructive" size="icon" className="size-7" onClick={() => handleDelete(item.id, item.name)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b font-medium text-sm text-muted-foreground">Tecnologias</div>
            {tecnologias.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {filterSchoolId && filterNap
                  ? "Nenhuma tecnologia vinculada a este NAP."
                  : "Nenhuma tecnologia cadastrada."}
              </div>
            ) : (
              tecnologias.map((item) => {
                const qty = getQty(item.id)
                const schoolsCount = totalSchools(item.id)
                return (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2 border-b last:border-b-0">
                    <div>
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex gap-1 mt-0.5">
                        {(item.naps || []).map((nap) => (
                          <span key={nap} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {nap}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {schoolsCount} escola{schoolsCount !== 1 ? "s" : ""}
                        {filterSchoolId && filterNap && ` — ${qty} un.`}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="size-7" onClick={() => handleEdit(item)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="destructive" size="icon" className="size-7" onClick={() => handleDelete(item.id, item.name)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
