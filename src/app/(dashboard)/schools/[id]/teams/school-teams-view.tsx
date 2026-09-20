"use client"

import { useEffect, useState } from "react"
import { Plus, X, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ActionTooltip } from "@/components/ui/action-tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { TbrCategory } from "@/lib/types"
import {
  getTbrCategories,
  getTbrTeamsBySchool,
  replaceTbrTeamsForSchool,
} from "@/lib/db"

export function SchoolTeamsView({ schoolId }: { schoolId: string }) {
  const [categories, setCategories] = useState<TbrCategory[]>([])
  const [teams, setTeams] = useState<{ id: string; categoryId: string; name: string }[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [teamName, setTeamName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [cats, existing] = await Promise.all([
        getTbrCategories(),
        getTbrTeamsBySchool(schoolId),
      ])
      setCategories(cats)
      setTeams(existing.map((t) => ({ id: t.id, categoryId: t.categoryId, name: t.name })))
      setCategoryId("")
      setTeamName("")
      setLoading(false)
    }
    load()
  }, [schoolId])

  function addTeam() {
    if (!categoryId || !teamName.trim()) return
    setTeams((prev) => [
      ...prev,
      { id: crypto.randomUUID(), categoryId, name: teamName.trim() },
    ])
    setTeamName("")
  }

  function removeTeam(id: string) {
    setTeams((prev) => prev.filter((t) => t.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await replaceTbrTeamsForSchool(
        schoolId,
        teams.map((t) => ({ categoryId: t.categoryId, name: t.name }))
      )
      toast.success("Equipes salvas com sucesso!")
    } catch {
      toast.error("Não foi possível salvar as equipes.")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma categoria cadastrada. Cadastre categorias em &quot;TBR&quot; no menu.
        </p>
      ) : (
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="teamCategory">Categoria</Label>
            <SearchableSelect
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Categoria"
              searchPlaceholder="Buscar categoria..."
              emptyText="Nenhuma categoria encontrada."
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="teamName">Nome da equipe</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nome da equipe"
            />
          </div>
          <Button type="button" variant="outline" size="icon" onClick={addTeam}>
            <Plus className="size-4" />
          </Button>
        </div>
      )}

      {teams.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhuma equipe cadastrada para esta escola.
        </p>
      ) : (
        <div className="flex flex-col gap-1 rounded-md border p-2">
          {teams.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                <span className="text-muted-foreground">
                  {categories.find((c) => c.id === t.categoryId)?.name ?? "-"}:
                </span>{" "}
                {t.name}
              </span>
              <ActionTooltip label="Excluir equipe">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => removeTeam(t.id)}
                  >
                    <X className="size-3" />
                  </Button>
                </ActionTooltip>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <LoaderCircle className="size-4 animate-spin" />}
          Salvar equipes
        </Button>
      </div>
    </div>
  )
}