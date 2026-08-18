"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, BookOpen, School as SchoolIcon, ChevronLeft, ChevronRight, Palette, X, LoaderCircle, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
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
import { SchoolsSkeleton } from "@/components/skeletons/schools-skeleton"
import type { School, User, Class, TbrCategory } from "@/lib/types"
import {
  getSchools,
  getSchoolsByYear,
  getSchoolYears,
  createSchool,
  updateSchool,
  deleteSchool,
  getClassesBySchool,
  getClasses,
  getRoomsByClass,
  getUsersByRole,
  getTbrCategories,
  getTbrTeamsBySchool,
  replaceTbrTeamsForSchool,
  getSchoolsByUser,
  getUsersBySchool,
  replaceUserSchools,
  getSession,
} from "@/lib/db"
import { REGIONS } from "@/lib/brazil-data"
import { fetchStatesByRegion, fetchCitiesByState } from "@/lib/ibge-api"

const PAGE_SIZES = [10, 20, 50, 100]

export default function SchoolsPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<import("@/lib/types").AuthUser | null>(null)
  const isOrientador = authUser?.role === "orientador"
  const myOrientadorId = authUser?.userId
  const [schools, setSchools] = useState<School[]>([])
  const [open, setOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [filterYear, setFilterYear] = useState("")
  const [filterActive, setFilterActive] = useState("active")
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [region, setRegion] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [color, setColor] = useState("")
  const [scheduleType, setScheduleType] = useState<"semanal" | "quinzenal">("semanal")
  const [schoolEmail, setSchoolEmail] = useState("")
  const [schoolPassword, setSchoolPassword] = useState("")
  const [showSchoolPassword, setShowSchoolPassword] = useState(false)
  const [orientadorId, setOrientadorId] = useState("")
  const [orientadores, setOrientadores] = useState<User[]>([])
  const [tbrCategories, setTbrCategories] = useState<TbrCategory[]>([])
  const [teams, setTeams] = useState<{ id: string; categoryId: string; name: string }[]>([])
  const [active, setActive] = useState(true)
  const [teamCategoryId, setTeamCategoryId] = useState("")
  const [teamName, setTeamName] = useState("")

  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([])
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [filterState, setFilterState] = useState("")
  const [filterOrientadorId, setFilterOrientadorId] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [schoolStats, setSchoolStats] = useState<Record<string, { classes: number; students: number; teams: number }>>({})
  const [schoolOrientadorMap, setSchoolOrientadorMap] = useState<Record<string, string>>({})
  const [schoolOrientadorIdMap, setSchoolOrientadorIdMap] = useState<Record<string, string>>({})
  const [schoolYears, setSchoolYears] = useState<string[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  const { setHeader } = usePageHeader()

  useEffect(() => {
    async function load() {
      const session = await getSession()
      setAuthUser(session)
      const orientadoresList = await getUsersByRole("orientador")
      setOrientadores(orientadoresList)
      setTbrCategories(await getTbrCategories())

      const classesData = await getClasses()
      setAllClasses(classesData)
      setSchoolYears(await getSchoolYears())

      let allSchools = await getSchools()
      if (isOrientador && myOrientadorId) {
        const mySchoolIds = await getSchoolsByUser(myOrientadorId)
        allSchools = allSchools.filter((s) => mySchoolIds.includes(s.id))
      }
      setSchools(allSchools)

      const oMap: Record<string, string> = {}
      const oIdMap: Record<string, string> = {}
      for (const school of allSchools) {
        const userIds = await getUsersBySchool(school.id)
        for (const userId of userIds) {
          const orientador = orientadoresList.find((o) => o.id === userId)
          if (orientador) {
            oMap[school.id] = orientador.name
            oIdMap[school.id] = orientador.id
            break
          }
        }
      }
      setSchoolOrientadorMap(oMap)
      setSchoolOrientadorIdMap(oIdMap)

      const stats: Record<string, { classes: number; students: number; teams: number }> = {}
      for (const school of allSchools) {
        const classes = await getClassesBySchool(school.id)
        let students = 0
        for (const cls of classes) {
          const rooms = await getRoomsByClass(cls.id)
          for (const room of rooms) {
            students += room.studentCount ?? 0
          }
        }
        const teamsCount = (await getTbrTeamsBySchool(school.id)).length
        stats[school.id] = { classes: classes.length, students, teams: teamsCount }
      }
      setSchoolStats(stats)
      setPageLoading(false)
    }
    load()
  }, [filterYear, isOrientador, myOrientadorId])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <SchoolIcon className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">{isOrientador ? "Minhas Escolas" : "Escolas"}</h1>
      </div>,
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-2" />
        Nova Escola
      </Button>
    )
  }, [])

  const [allClasses, setAllClasses] = useState<Class[]>([])

  const schoolsByAcademicYear = filterYear
    ? new Set(allClasses.filter((c) => c.year === filterYear).map((c) => c.schoolId))
    : null

  const filteredSchools = schools
    .filter((s) => !schoolsByAcademicYear || schoolsByAcademicYear.has(s.id))
    .filter((s) => !filterState || s.state === filterState)
    .filter((s) => !filterOrientadorId || schoolOrientadorIdMap[s.id] === filterOrientadorId)
    .filter((s) => filterActive === "all" || (filterActive === "active" ? s.active !== false : s.active === false))

  const totalPages = Math.ceil(filteredSchools.length / pageSize)
  const paginatedSchools = filteredSchools.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  useEffect(() => {
    setPage(1)
  }, [filterYear, filterState, filterOrientadorId, filterActive, pageSize])

  async function refresh() {
    let allSchools = await getSchools()
    if (isOrientador && myOrientadorId) {
      const mySchoolIds = await getSchoolsByUser(myOrientadorId)
      allSchools = allSchools.filter((s) => mySchoolIds.includes(s.id))
    }
    setSchools(allSchools)

    const oMap: Record<string, string> = {}
    const oIdMap: Record<string, string> = {}
    for (const school of allSchools) {
      const userIds = await getUsersBySchool(school.id)
      for (const userId of userIds) {
        const orientador = orientadores.find((o) => o.id === userId)
        if (orientador) {
          oMap[school.id] = orientador.name
          oIdMap[school.id] = orientador.id
          break
        }
      }
    }
    setSchoolOrientadorMap(oMap)
    setSchoolOrientadorIdMap(oIdMap)

    const newStats: Record<string, { classes: number; students: number; teams: number }> = {}
    for (const school of allSchools) {
      const classes = await getClassesBySchool(school.id)
      let students = 0
      for (const cls of classes) {
        const rooms = await getRoomsByClass(cls.id)
        for (const room of rooms) {
          students += room.studentCount ?? 0
        }
      }
      const teamsCount = (await getTbrTeamsBySchool(school.id)).length
      newStats[school.id] = { classes: classes.length, students, teams: teamsCount }
    }
    setSchoolStats(newStats)
    router.refresh()
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingSchool(null)
      setName("")
      setAddress("")
      setRegion("")
      setState("")
      setCity("")
      setColor("")
      setScheduleType("semanal")
      setSchoolEmail("")
      setSchoolPassword("")
      setShowSchoolPassword(false)
      setOrientadorId(isOrientador && myOrientadorId ? myOrientadorId : "")
      setActive(true)
      setStateOptions([])
      setCityOptions([])
      setTeams([])
      setTeamCategoryId("")
      setTeamName("")
    }
  }

  function addTeam() {
    if (!teamCategoryId || !teamName.trim()) return
    setTeams((prev) => [
      ...prev,
      { id: crypto.randomUUID(), categoryId: teamCategoryId, name: teamName.trim() },
    ])
    setTeamName("")
  }

  function removeTeam(id: string) {
    setTeams((prev) => prev.filter((t) => t.id !== id))
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

  async function handleEdit(school: School) {
    setEditingSchool(school)
    setName(school.name)
    setAddress(school.address)
    setColor(school.color ?? "")
    setScheduleType(school.scheduleType ?? "semanal")
    setSchoolEmail(school.email ?? "")
    setSchoolPassword(school.password ?? "")
    const userIds = await getUsersBySchool(school.id)
    const orientadorUserId = userIds.find((uid) => orientadores.some((o) => o.id === uid)) ?? ""
    setOrientadorId(orientadorUserId)
    setActive(school.active !== false)
    const tbrTeams = await getTbrTeamsBySchool(school.id)
    setTeams(
      tbrTeams.map((t) => ({
        id: t.id,
        categoryId: t.categoryId,
        name: t.name,
      }))
    )
    setOpen(true)

    setLoadingStates(true)
    try {
      const data = await fetchStatesByRegion(school.region)
      const mapped = data.map((s) => ({
        value: s.sigla,
        label: `${s.sigla} - ${s.nome}`,
      }))
      setStateOptions(mapped)
      setRegion(school.region)
      setState(school.state)
    } catch {
      setStateOptions([])
    } finally {
      setLoadingStates(false)
    }

    setLoadingCities(true)
    try {
      const data = await fetchCitiesByState(school.state)
      setCityOptions(data.map((c) => ({ value: c.nome, label: c.nome })))
      setCity(school.city)
    } catch {
      setCityOptions([])
    } finally {
      setLoadingCities(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const finalOrientadorId = isOrientador && myOrientadorId ? myOrientadorId : (orientadorId || undefined)
    let schoolId: string
    if (editingSchool) {
      await updateSchool(editingSchool.id, {
        name: name.trim(),
        address: address.trim(),
        region,
        state,
        city,
        color: color || undefined,
        scheduleType,
        email: schoolEmail.trim() || undefined,
        password: schoolPassword.trim() || "mudar123",
        active,
      })
      schoolId = editingSchool.id
    } else {
      const created = await createSchool({
        name: name.trim(),
        address: address.trim(),
        region,
        state,
        city,
        color: color || undefined,
        scheduleType,
        email: schoolEmail.trim() || undefined,
        password: schoolPassword.trim() || "mudar123",
        active,
      })
      schoolId = created.id
    }
    if (finalOrientadorId) {
      await replaceUserSchools(finalOrientadorId, [schoolId])
    }
    await replaceTbrTeamsForSchool(
      schoolId,
      teams.map((t) => ({ categoryId: t.categoryId, name: t.name }))
    )
    handleOpenChange(false)
    setSaving(false)
    await refresh()
    toast.success(editingSchool ? "Escola editada com sucesso!" : "Escola criada com sucesso!")
  }

  function handleDelete(id: string, label: string) {
    setDeleteTarget({ id, label })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteSchool(deleteTarget.id)
    setDeleteTarget(null)
    await refresh()
    toast.success("Escola excluída com sucesso!")
  }

  const allStates = Array.from(new Set(schools.map((s) => s.state).filter(Boolean)))

  if (pageLoading) return <SchoolsSkeleton />

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingSchool ? "Editar Escola" : "Nova Escola"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da escola"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Endereço da escola"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="schoolEmail">Email de acesso</Label>
                <Input
                  id="schoolEmail"
                  type="email"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  placeholder="Email para login da escola"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Senha de acesso</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showSchoolPassword ? "text" : "password"}
                    value={schoolPassword}
                    onChange={(e) => setSchoolPassword(e.target.value)}
                    placeholder="Senha (padrão: mudar123)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSchoolPassword(!showSchoolPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showSchoolPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Credenciais usadas pela escola para acessar o sistema. Deixe a senha em branco
              para usar &quot;mudar123&quot;.
            </p>
            <div className="flex items-center gap-3">
              <Label htmlFor="color" className="flex items-center gap-2 text-sm whitespace-nowrap">
                <Palette className="size-4" />
                Cor
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="color"
                  type="color"
                  value={color || "#8b5cf6"}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-9 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
                {color && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setColor("")}
                    className="text-xs"
                  >
                    Remover cor
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm">Ativa</Label>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? "bg-primary" : "bg-input"}`}
              >
                <span
                  className={`inline-block size-5 rounded-full bg-white transition-transform ${active ? "translate-x-[22px]" : "translate-x-[2px]"}`}
                />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Aulas (horários)</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleType("semanal")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    scheduleType === "semanal"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Semanal
                  <span className="block text-xs font-normal text-muted-foreground">
                    Todas as semanas
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType("quinzenal")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    scheduleType === "quinzenal"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Quinzenal
                  <span className="block text-xs font-normal text-muted-foreground">
                    Alterna quinzena 1 / quinzena 2
                  </span>
                </button>
              </div>
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
                <Label>Cidade</Label>
                <SearchableSelect
                  options={cityOptions}
                  value={city}
                  onChange={setCity}
                  placeholder="Cidade"
                  searchPlaceholder="Buscar cidade..."
                  emptyText="Nenhuma cidade encontrada."
                  loading={loadingCities}
                  disabled={!state}
                />
              </div>
            </div>
            {!isOrientador && (
              <div className="flex flex-col gap-2">
                <Label>Orientador</Label>
                <SearchableSelect
                  options={[
                    { value: "", label: "Nenhum orientador" },
                    ...orientadores.map((o) => ({ value: o.id, label: o.name })),
                  ]}
                  value={orientadorId}
                  onChange={setOrientadorId}
                  placeholder="Selecione um orientador"
                  searchPlaceholder="Buscar orientador..."
                  emptyText="Nenhum orientador encontrado."
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>Equipes TBR</Label>
              {tbrCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma categoria cadastrada. Cadastre categorias em &quot;TBR&quot; no menu.
                </p>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={tbrCategories.map((c) => ({ value: c.id, label: c.name }))}
                      value={teamCategoryId}
                      onChange={setTeamCategoryId}
                      placeholder="Categoria"
                      searchPlaceholder="Buscar categoria..."
                      emptyText="Nenhuma categoria encontrada."
                    />
                  </div>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Nome da equipe"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTeam}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              )}
              {teams.length > 0 && (
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-md border p-2">
                  {teams.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <span>
                        <span className="text-muted-foreground">
                          {tbrCategories.find((c) => c.id === t.categoryId)?.name ?? "-"}:
                        </span>{" "}
                        {t.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => removeTeam(t.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {editingSchool ? "Salvar" : "Criar"}
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
            Tem certeza que deseja excluir <strong>{deleteTarget?.label}</strong>?
            {deleteTarget && (() => {
              const count = schoolStats[deleteTarget.id]?.classes ?? 0
              return count > 0 ? (
                <> Esta ação irá remover também {count} turma{count > 1 ? "s" : ""}, salas, alunos e horários vinculados.</>
              ) : null
            })()}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Ano:</Label>
          <SearchableSelect
            options={[
              { value: "", label: "Todos os anos" },
              ...schoolYears.map((y) => ({ value: y, label: y })),
            ]}
            value={filterYear}
            onChange={setFilterYear}
            placeholder="Todos os anos"
            searchPlaceholder="Buscar ano..."
            emptyText="Nenhum ano encontrado."
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Status:</Label>
          <SearchableSelect
            options={[
              { value: "active", label: "Ativas" },
              { value: "inactive", label: "Inativas" },
              { value: "all", label: "Todas" },
            ]}
            value={filterActive}
            onChange={(v) => v && setFilterActive(v)}
            placeholder="Ativas"
            searchPlaceholder=""
            emptyText=""
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Filtrar por Estado:</Label>
          <SearchableSelect
            options={[
              { value: "", label: "Todos os estados" },
              ...allStates.map((uf) => ({ value: uf, label: uf })),
            ]}
            value={filterState}
            onChange={setFilterState}
            placeholder="Todos os estados"
            searchPlaceholder="Buscar estado..."
            emptyText="Nenhum estado encontrado."
          />
          {filterState && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterState("")}
            >
              Limpar
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Filtrar por Orientador:</Label>
          <SearchableSelect
            options={[
              { value: "", label: "Todos os orientadores" },
              ...orientadores.map((o) => ({ value: o.id, label: o.name })),
            ]}
            value={filterOrientadorId}
            onChange={setFilterOrientadorId}
            placeholder="Todos os orientadores"
            searchPlaceholder="Buscar orientador..."
            emptyText="Nenhum orientador encontrado."
          />
          {filterOrientadorId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterOrientadorId("")}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escolas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedSchools.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma escola cadastrada.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Horários</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Orientador</TableHead>
                    <TableHead>Qtd Turmas</TableHead>
                    <TableHead>Qtd Alunos</TableHead>
                    <TableHead>Equipes TBR</TableHead>
                    <TableHead className="w-px">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSchools.map((school) => (
                    <TableRow key={school.id} className={school.active === false ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {school.active !== false ? (
                            <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="size-3.5 text-muted-foreground shrink-0" />
                          )}
                          {school.color && (
                            <span
                              className="inline-block size-3 rounded-full shrink-0"
                              style={{ backgroundColor: school.color }}
                            />
                          )}
                          {school.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            (school.scheduleType ?? "semanal") === "quinzenal"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {(school.scheduleType ?? "semanal") === "quinzenal"
                            ? "Quinzenal"
                            : "Semanal"}
                        </span>
                      </TableCell>
                      <TableCell>{school.state || "-"}</TableCell>
                      <TableCell>{school.city || "-"}</TableCell>
                      <TableCell>
                        {schoolOrientadorMap[school.id] || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {schoolStats[school.id]?.classes ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {schoolStats[school.id]?.students ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {schoolStats[school.id]?.teams ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/schools/${school.id}/classes`}
                          >
                            <Button variant="outline" size="icon">
                              <BookOpen className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(school)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(school.id, school.name)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Exibir</span>
                  <SearchableSelect
                    options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
                    value={String(pageSize)}
                    onChange={(v) => v && setPageSize(Number(v))}
                    placeholder="10"
                    searchPlaceholder=""
                    emptyText=""
                  />
                  <span>
                    de {filteredSchools.length} escola{filteredSchools.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true
                      if (p === 1 || p === totalPages) return true
                      if (Math.abs(p - page) <= 1) return true
                      return false
                    })
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && arr[idx - 1] !== p - 1) {
                        acc.push("...")
                      }
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="icon"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
