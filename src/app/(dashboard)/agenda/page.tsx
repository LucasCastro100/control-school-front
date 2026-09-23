"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Plus,
  Trash2,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Play,
  Square,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Checkbox } from "@/components/ui/checkbox"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { MultiSearchableSelect } from "@/components/ui/multi-searchable-select"
import { usePageHeader } from "@/lib/page-header"
import { AgendaSkeleton } from "@/components/skeletons/agenda-skeleton"
import { cn } from "@/lib/utils"
import type { AuthUser, User, School, AgendaItem } from "@/lib/types"
import {
  getSession,
  getUsersByRole,
  getUserSchools,
  getSchools,
  getAgendaItems,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
} from "@/lib/db"

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const ORIENTADOR_COLORS = [
  "oklch(0.55 0.2 245)",
  "oklch(0.55 0.2 25)",
  "oklch(0.55 0.18 150)",
  "oklch(0.55 0.2 310)",
  "oklch(0.55 0.16 45)",
  "oklch(0.55 0.2 350)",
  "oklch(0.55 0.18 190)",
]

const MONITOR_TIPOS = ["Presencial", "Remoto", "Híbrido"]

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  })
}

export default function AgendaPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [orientadores, setOrientadores] = useState<User[]>([])
  const [userSchools, setUserSchools] = useState<School[]>([])
  const [items, setItems] = useState<AgendaItem[]>([])
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [filterOrientador, setFilterOrientador] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AgendaItem | null>(null)
  const [formDate, setFormDate] = useState("")
  const [formOrientadorIds, setFormOrientadorIds] = useState<string[]>([])
  const [formStart, setFormStart] = useState("")
  const [formEnd, setFormEnd] = useState("")
  const [formActivity, setFormActivity] = useState("")
  const [formRegistrarMundoz, setFormRegistrarMundoz] = useState(false)
  const [formEscola, setFormEscola] = useState("")
  const [formAno, setFormAno] = useState("")
  const [formTipo, setFormTipo] = useState("")
  const [formConfirmadoPor, setFormConfirmadoPor] = useState("")
  const [saving, setSaving] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [monStatus, setMonStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [monLog, setMonLog] = useState<string[]>([])
  const [monShowBrowser, setMonShowBrowser] = useState(false)
  const [monErr, setMonErr] = useState("")
  const { setHeader } = usePageHeader()

  const isAdmin = user?.role === "admin"
  const isOrientador = user?.role === "orientador"

  useEffect(() => {
    if (monStatus !== "running") return
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/monitoramento/status")
        const j = (await res.json()) as { log?: string[]; state?: { status?: string } }
        if (j.log) setMonLog(j.log)
        if (j.state?.status === "done" || j.state?.status === "error") {
          setMonStatus(j.state.status)
        }
      } catch {
        // continua tentando
      }
    }, 2000)
    return () => clearInterval(t)
  }, [monStatus])

  useEffect(() => {
    async function load() {
      const session = await getSession()
      setUser(session)
      if (session?.role === "orientador" && session.userId) {
        setFilterOrientador(session.userId)
        const schools = await getUserSchools(session.userId)
        setUserSchools(schools)
      } else if (session?.role === "admin") {
        const schools = await getSchools()
        setUserSchools(schools)
      }
      const [o, i] = await Promise.all([getUsersByRole("orientador"), getAgendaItems()])
      setOrientadores(o)
      setItems(i)
      setPageLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <CalendarDays className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Agenda</h1>
      </div>,
      <Button size="sm" onClick={() => openCreate(new Date())}>
        <Plus className="size-4 mr-2" />
        Nova Atividade
      </Button>
    )
  }, [isAdmin, user?.userId])

  const grid = buildGrid(current.year, current.month)

  const visibleItems = useMemo(() => {
    if (filterOrientador) {
      return items.filter((i) => i.orientadorIds.includes(filterOrientador))
    }
    return items
  }, [items, filterOrientador])

  const itemsByDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>()
    for (const item of visibleItems) {
      const arr = map.get(item.date) ?? []
      arr.push(item)
      map.set(item.date, arr)
    }
    return map
  }, [visibleItems])

  function orientadorColor(id: string): string {
    const idx = orientadores.findIndex((o) => o.id === id)
    return ORIENTADOR_COLORS[(idx >= 0 ? idx : 0) % ORIENTADOR_COLORS.length]
  }

  function orientadorName(id: string): string {
    return orientadores.find((o) => o.id === id)?.name ?? "Orientador"
  }

  function openCreate(day: Date) {
    setEditing(null)
    setFormDate(dateKey(day))
    setFormOrientadorIds(isAdmin ? [] : (user?.userId ? [user.userId] : []))
    setFormStart("")
    setFormEnd("")
    setFormActivity("")
    setFormRegistrarMundoz(false)
    setFormEscola("")
    setFormAno(String(new Date().getFullYear()))
    setFormTipo("Presencial")
    setFormConfirmadoPor(user?.name ?? "")
    setOpen(true)
  }

  function openEdit(item: AgendaItem) {
    setEditing(item)
    setFormDate(item.date)
    setFormOrientadorIds([...item.orientadorIds])
    setFormStart(item.startTime)
    setFormEnd(item.endTime)
    setFormActivity(item.activity)
    setFormRegistrarMundoz(!!item.registrarMundoz)
    setFormEscola(item.escola ? (userSchools.find((s) => s.name === item.escola)?.id ?? "") : "")
    setFormAno(item.ano ?? String(new Date().getFullYear()))
    setFormTipo(item.tipo ?? "Presencial")
    setFormConfirmadoPor(item.confirmadoPor ?? user?.name ?? "")
    setOpen(true)
  }

  async function handleSave() {
    if (!formDate || formOrientadorIds.length === 0 || !formStart || !formEnd || !formActivity.trim()) {
      return
    }
    setSaving(true)
    const selectedEscola = userSchools.find((s) => s.id === formEscola)?.name ?? formEscola
    const data = {
      orientadorIds: formOrientadorIds,
      date: formDate,
      startTime: formStart,
      endTime: formEnd,
      activity: formActivity.trim(),
      registrarMundoz: formRegistrarMundoz,
      escola: formRegistrarMundoz ? selectedEscola : "",
      ano: formRegistrarMundoz ? formAno : "",
      tipo: formRegistrarMundoz ? formTipo : "",
      confirmadoPor: formRegistrarMundoz ? formConfirmadoPor : "",
    }
    if (editing) {
      await updateAgendaItem(editing.id, data)
    } else {
      await createAgendaItem(data)
    }
    const updated = await getAgendaItems()
    setItems(updated)
    setOpen(false)
    setEditing(null)
    setSaving(false)
  }

  async function confirmDelete() {
    if (!editing) return
    await deleteAgendaItem(editing.id)
    const updated = await getAgendaItems()
    setItems(updated)
    setOpen(false)
    setEditing(null)
  }

  async function handleRunMonitor() {
    if (!user) return
    setMonErr("")
    setMonLog([])
    const targets = items.filter(
      (i) => i.orientadorIds.includes(user.userId ?? "") && i.registrarMundoz
    )
    if (targets.length === 0) {
      setMonErr("Nenhuma atividade sua marcada como 'Registrar no MundoZ' na agenda.")
      return
    }
    try {
      const res = await fetch("/api/monitoramento/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: targets, showBrowser: monShowBrowser }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setMonErr(j.error || "Falha ao iniciar a automação.")
        return
      }
      setMonStatus("running")
    } catch {
      setMonErr("Falha de conexão com o servidor.")
    }
  }

  async function handleStopMonitor() {
    await fetch("/api/monitoramento/stop", { method: "POST" })
    setMonStatus("idle")
  }

  function monLogClass(line: string): string {
    if (line.startsWith("MONITORAMENTO OK") || line.startsWith("LOGIN OK")) return "text-[#4bd081]"
    if (line.includes("FALHA") || line.includes("Erro") || line.includes("error")) return "text-[#ff7b74]"
    return "text-[#5f6b7c]"
  }

  function changeMonth(delta: number) {
    setCurrent((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function goToday() {
    const now = new Date()
    setCurrent({ year: now.getFullYear(), month: now.getMonth() })
  }

  const todayKey = dateKey(new Date())

  if (pageLoading) return <AgendaSkeleton />

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" onClick={goToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-base font-semibold">
            {MONTH_NAMES[current.month]} {current.year}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="w-64">
              <SearchableSelect
                options={[
                  { value: "", label: "Todos os orientadores" },
                  ...orientadores.map((o) => ({ value: o.id, label: o.name })),
                ]}
                value={filterOrientador}
                onChange={setFilterOrientador}
                placeholder="Todos os orientadores"
                searchPlaceholder="Buscar orientador..."
                emptyText="Nenhum orientador encontrado."
              />
            </div>
          )}
          {!isAdmin && user?.userId && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: orientadorColor(user.userId) }}
              />
              {orientadorName(user.userId)}
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => openCreate(new Date())}>
          <Plus className="size-4 mr-2" />
          Nova Atividade
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px bg-border">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-background px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {grid.map((day) => {
              const key = dateKey(day)
              const inMonth = day.getMonth() === current.month
              const today = key === todayKey
              const dayItems = itemsByDate.get(key) ?? []
              return (
                <div
                  key={key}
                  onClick={() => openCreate(day)}
                  className={`min-h-28 cursor-pointer bg-background p-1.5 flex flex-col gap-1 transition-colors hover:bg-accent/40 ${
                    inMonth ? "" : "opacity-40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        today
                          ? "inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          : ""
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {dayItems.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayItems.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(item)
                        }}
                        className="truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: orientadorColor(item.orientadorIds[0] ?? "") }}
                        title={`${item.activity} (${item.startTime} - ${item.endTime}) - ${item.orientadorIds.map(orientadorName).join(", ")}${item.registrarMundoz ? " - MundoZ" : ""}`}
                      >
                        {item.startTime} {item.activity}
                        {item.registrarMundoz && <span className="ml-1 font-bold">·MZ</span>}
                      </button>
                    ))}
                    {dayItems.length > 3 && (
                      <span className="text-[10px] text-muted-foreground px-1.5">
                        +{dayItems.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {isOrientador && (
        <Card>
          <CardHeader>
            <CardTitle>Automação MundoZ</CardTitle>
            <CardDescription>
              Registra na plataforma MundoZ as atividades da sua agenda marcadas como
              &ldquo;Registrar no MundoZ&rdquo;.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={monShowBrowser}
                  onCheckedChange={setMonShowBrowser}
                  disabled={monStatus === "running"}
                  aria-label="Mostrar navegador durante a execução"
                />
                Mostrar navegador durante a execução
              </label>
              <Button onClick={handleRunMonitor} disabled={monStatus === "running"}>
                {monStatus === "running" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4 mr-2" />
                )}
                {monStatus === "running" ? "Registrando…" : "Registrar no MundoZ"}
              </Button>
              {monStatus === "running" && (
                <Button variant="destructive" onClick={handleStopMonitor}>
                  <Square className="size-4 mr-2" />
                  Parar
                </Button>
              )}
            </div>
            {monStatus === "done" && (
              <p className="text-sm text-emerald-500">Registro de monitoramentos concluído.</p>
            )}
            {monStatus === "error" && (
              <p className="text-sm text-red-500">A automação terminou com erro — veja o log abaixo.</p>
            )}
            {monErr && <p className="text-sm text-red-500">{monErr}</p>}
            {monLog.length > 0 && (
              <div className="max-h-72 overflow-y-auto rounded-xl bg-[#10151d] p-4 font-mono text-xs leading-relaxed text-[#b8c4d4]">
                {monLog.map((l, i) => (
                  <div key={i} className={monLogClass(l)}>
                    {l}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Orientadores</Label>
              {isAdmin ? (
                <MultiSearchableSelect
                  options={orientadores.map((o) => ({ value: o.id, label: o.name }))}
                  value={formOrientadorIds}
                  onChange={setFormOrientadorIds}
                  placeholder="Selecione os orientadores"
                  searchPlaceholder="Buscar orientador..."
                  emptyText="Nenhum orientador encontrado."
                />
              ) : (
                <Input
                  value={orientadorName(user?.userId ?? "")}
                  readOnly
                  className="bg-muted"
                />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start">Início</Label>
                <Input
                  id="start"
                  type="time"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end">Fim</Label>
                <Input
                  id="end"
                  type="time"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="activity">Atividade</Label>
              <Input
                id="activity"
                value={formActivity}
                onChange={(e) => setFormActivity(e.target.value)}
                placeholder="Ex: Visita à escola"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium">
              <Checkbox
                checked={formRegistrarMundoz}
                onCheckedChange={(v) => setFormRegistrarMundoz(v === true)}
                aria-label="Registrar no MundoZ"
              />
              Registrar no MundoZ
            </label>
            {formRegistrarMundoz && (
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex flex-col gap-2">
                  <Label>Escola</Label>
                  <SearchableSelect
                    options={userSchools.map((s) => ({ value: s.id, label: s.name }))}
                    value={formEscola}
                    onChange={setFormEscola}
                    placeholder="Selecione a escola"
                    searchPlaceholder="Buscar escola..."
                    emptyText="Nenhuma escola encontrada."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Input
                      id="ano"
                      value={formAno}
                      onChange={(e) => setFormAno(e.target.value)}
                      placeholder={String(new Date().getFullYear())}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Tipo</Label>
                    <SearchableSelect
                      options={MONITOR_TIPOS.map((t) => ({ value: t, label: t }))}
                      value={formTipo}
                      onChange={setFormTipo}
                      placeholder="Selecione o tipo"
                      searchPlaceholder="Buscar tipo..."
                      emptyText="Nenhum tipo encontrado."
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmadoPor">Confirmado por</Label>
                  <Input
                    id="confirmadoPor"
                    value={formConfirmadoPor}
                    onChange={(e) => setFormConfirmadoPor(e.target.value)}
                    placeholder="Quem confirmou a visita"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              {editing ? (
                <Button variant="destructive" onClick={confirmDelete}>
                  <Trash2 className="size-4 mr-2" />
                  Excluir
                </Button>
              ) : (
                <span />
              )}
              <Button onClick={handleSave} disabled={saving || orientadores.length === 0 || formOrientadorIds.length === 0}>
                {saving && <LoaderCircle className="size-4 animate-spin" />}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {orientadores.length === 0 && isAdmin && (
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhum orientador cadastrado. Cadastre orientadores na página de Orientadores para
          registrar atividades.
        </p>
      )}
    </>
  )
}
