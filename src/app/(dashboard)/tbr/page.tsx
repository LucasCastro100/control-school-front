"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
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
import type { TbrCategory } from "@/lib/types"
import {
  getTbrCategories,
  createTbrCategory,
  updateTbrCategory,
  deleteTbrCategory,
  getAllTbrTeams,
} from "@/lib/db"

export default function TbrPage() {
  const [categories, setCategories] = useState<TbrCategory[]>([])
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({})
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TbrCategory | null>(null)
  const [name, setName] = useState("")
  const { setHeader } = usePageHeader()

  function refresh() {
    setCategories(getTbrCategories())
    const teams = getAllTbrTeams()
    const counts: Record<string, number> = {}
    for (const team of teams) {
      counts[team.categoryId] = (counts[team.categoryId] ?? 0) + 1
    }
    setTeamCounts(counts)
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <Users className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">TBR</h1>
      </div>,
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-2" />
        Nova Categoria
      </Button>
    )
  }, [])

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingCategory(null)
      setName("")
    }
  }

  function handleEdit(category: TbrCategory) {
    setEditingCategory(category)
    setName(category.name)
    setOpen(true)
  }

  function handleSave() {
    if (!name.trim()) return
    if (editingCategory) {
      updateTbrCategory(editingCategory.id, { name: name.trim() })
    } else {
      createTbrCategory({ name: name.trim() })
    }
    handleOpenChange(false)
    refresh()
  }

  function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir esta categoria? As equipes cadastradas nela também serão removidas.")) {
      deleteTbrCategory(id)
      refresh()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sub-10, Sub-14"
              />
            </div>
            <Button onClick={handleSave}>
              {editingCategory ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Categorias TBR</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma categoria cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Qtd Equipes</TableHead>
                  <TableHead className="w-px">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {teamCounts[category.id] ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
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
