"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  School as SchoolIcon,
  UsersRound,
  BookOpen,
  GraduationCap,
  Package,
  CalendarDays,
  ArrowRight,
  ArrowUpRight,
  Clock,
  CalendarPlus,
  Plus,
  Building2,
  MapPin,
  LayoutGrid,
  Users,
  Activity,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import SpotlightCard from "@/components/SpotlightCard"
import CountUp from "@/components/CountUp"
import { usePageHeader } from "@/lib/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  getSession,
  getSchools,
  getClasses,
  getRooms,
  getUsers,
  getAllItems,
  getAgendaItems,
  getAllTbrTeams,
  getSchoolsByUser,
} from "@/lib/db"
import type {
  AuthUser,
  School,
  Class,
  Room,
  User,
  Item,
  AgendaItem,
  TbrTeam,
} from "@/lib/types"

const ROLE_LABELS: Record<AuthUser["role"], string> = {
  admin: "Administrador",
  orientador: "Orientador",
  professor: "Professor",
  escola: "Escola",
}

const modules = [
  {
    href: "/schools",
    label: "Escolas",
    description: "Cadastro e unidades",
    icon: SchoolIcon,
    tint: "from-violet-500/20 to-violet-500/0 text-violet-300 ring-violet-400/20",
  },
  {
    href: "/users",
    label: "Usuários",
    description: "Equipe e vínculos",
    icon: UsersRound,
    tint: "from-sky-500/20 to-sky-500/0 text-sky-300 ring-sky-400/20",
  },
  {
    href: "/items",
    label: "Itens",
    description: "Tapetes e tecnologia",
    icon: Package,
    tint: "from-fuchsia-500/20 to-fuchsia-500/0 text-fuchsia-300 ring-fuchsia-400/20",
  },
  {
    href: "/tbr",
    label: "TBR",
    description: "Times e categorias",
    icon: Users,
    tint: "from-amber-500/20 to-amber-500/0 text-amber-300 ring-amber-400/20",
  },
  {
    href: "/all-schedules",
    label: "Horário Geral",
    description: "Grade semanal",
    icon: Clock,
    tint: "from-emerald-500/20 to-emerald-500/0 text-emerald-300 ring-emerald-400/20",
  },
  {
    href: "/agenda",
    label: "Agenda",
    description: "Compromissos e visitas",
    icon: CalendarDays,
    tint: "from-rose-500/20 to-rose-500/0 text-rose-300 ring-rose-400/20",
  },
]

const orientadorModules = [
  {
    href: "/schools",
    label: "Minhas Escolas",
    description: "Unidades vinculadas",
    icon: SchoolIcon,
    tint: "from-violet-500/20 to-violet-500/0 text-violet-300 ring-violet-400/20",
  },
  {
    href: "/agenda",
    label: "Agenda",
    description: "Compromissos e visitas",
    icon: CalendarDays,
    tint: "from-rose-500/20 to-rose-500/0 text-rose-300 ring-rose-400/20",
  },
]

function dateKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatTime(value: string): string {
  if (!value) return "-"
  return value.slice(0, 5)
}

type SpotlightColor = `rgba(${number}, ${number}, ${number}, ${number})`

interface StatCardProps {
  label: string
  value: number
  note: string
  icon: LucideIcon
  tint: string
  spotlight: SpotlightColor
}

function StatCard({ label, value, note, icon: Icon, tint, spotlight }: StatCardProps) {
  return (
    <SpotlightCard
      spotlightColor={spotlight}
      className="group/stat relative overflow-hidden rounded-2xl p-5 shadow-xl shadow-black/20"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl transition-opacity group-hover/stat:opacity-100" />
      <div className="flex items-center justify-between gap-3">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl ring-1", tint)}>
          <Icon className="size-5" />
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground/40 transition-all group-hover/stat:translate-x-0.5 group-hover/stat:-translate-y-0.5 group-hover/stat:text-primary" />
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums">
        <CountUp to={value} duration={1.8} separator="." />
      </p>
      <p className="mt-1 text-sm font-medium text-foreground/90">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
    </SpotlightCard>
  )
}

export default function DashboardHomePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [agenda, setAgenda] = useState<AgendaItem[]>([])
  const [teams, setTeams] = useState<TbrTeam[]>([])
  const { setHeader } = usePageHeader()

  useEffect(() => {
    async function load() {
      const session = await getSession()
      setUser(session)

      const [schoolsData, classesData, roomsData, usersData, itemsData, agendaData, teamsData] =
        await Promise.all([
          getSchools(),
          getClasses(),
          getRooms(),
          getUsers(),
          getAllItems(),
          getAgendaItems(),
          getAllTbrTeams(),
        ])

      let visibleSchools = schoolsData
      if (session?.role === "orientador" && session.userId) {
        const mySchoolIds = new Set(await getSchoolsByUser(session.userId))
        visibleSchools = schoolsData.filter((s) => mySchoolIds.has(s.id))
      }

      setSchools(visibleSchools)
      setClasses(classesData)
      setRooms(roomsData)
      setUsers(usersData)
      setItems(itemsData ?? [])
      setAgenda(agendaData)
      setTeams(teamsData)

      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <LayoutGrid className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Visão geral</h1>
      </div>
    )
  }, [setHeader])

  const orientadores = useMemo(() => users.filter((u) => u.role === "orientador"), [users])

  const visibleSchoolIds = useMemo(() => new Set(schools.map((s) => s.id)), [schools])
  const isOrientador = user?.role === "orientador"

  const scopedClasses = useMemo(
    () => (isOrientador ? classes.filter((c) => visibleSchoolIds.has(c.schoolId)) : classes),
    [classes, isOrientador, visibleSchoolIds]
  )
  const scopedClassIds = useMemo(() => new Set(scopedClasses.map((c) => c.id)), [scopedClasses])
  const scopedRooms = useMemo(
    () => (isOrientador ? rooms.filter((r) => scopedClassIds.has(r.classId)) : rooms),
    [isOrientador, rooms, scopedClassIds]
  )

  const students = useMemo(
    () => scopedRooms.reduce((acc, room) => acc + (room.studentCount ?? 0), 0),
    [scopedRooms]
  )

  const todayKey = dateKey(new Date())

  const agendaToday = useMemo(
    () =>
      agenda
        .filter((a) => a.date === todayKey)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [agenda, todayKey]
  )

  const upcoming = useMemo(
    () =>
      agenda
        .filter((a) => a.date >= todayKey)
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
        .slice(0, 5),
    [agenda, todayKey]
  )

  const schoolOverview = useMemo(() => {
    const classesBySchool = new Map<string, number>()
    for (const c of scopedClasses) {
      classesBySchool.set(c.schoolId, (classesBySchool.get(c.schoolId) ?? 0) + 1)
    }

    const classBySchoolId = new Map<string, string>()
    for (const c of classes) classBySchoolId.set(c.id, c.schoolId)
    const studentsBySchool = new Map<string, number>()
    for (const r of rooms) {
      const schoolId = classBySchoolId.get(r.classId)
      if (schoolId) {
        studentsBySchool.set(schoolId, (studentsBySchool.get(schoolId) ?? 0) + (r.studentCount ?? 0))
      }
    }

    const teamsBySchool = new Map<string, number>()
    for (const t of teams) {
      teamsBySchool.set(t.schoolId, (teamsBySchool.get(t.schoolId) ?? 0) + 1)
    }

    return schools.slice(0, 5).map((s) => ({
      school: s,
      classes: classesBySchool.get(s.id) ?? 0,
      students: studentsBySchool.get(s.id) ?? 0,
      teams: teamsBySchool.get(s.id) ?? 0,
    }))
  }, [schools, scopedClasses, classes, rooms, teams])

  const orientadorName = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of users) map.set(u.id, u.name)
    return map
  }, [users])

  const firstName = (user?.name ?? "Usuário").split(" ")[0]
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })

  const statCards: StatCardProps[] = [
    {
      label: "Escolas",
      value: schools.length,
      note: isOrientador ? "Unidades vinculadas" : "Unidades no sistema",
      icon: SchoolIcon,
      tint: "bg-primary/15 text-primary ring-primary/30",
      spotlight: "rgba(139, 92, 246, 0.18)",
    },
    {
      label: "Turmas",
      value: scopedClasses.length,
      note: "Turmas cadastradas",
      icon: BookOpen,
      tint: "bg-secondary/15 text-secondary ring-secondary/30",
      spotlight: "rgba(34, 211, 238, 0.18)",
    },
    {
      label: "Alunos",
      value: students,
      note: "Total de alunos",
      icon: GraduationCap,
      tint: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
      spotlight: "rgba(52, 211, 153, 0.18)",
    },
    {
      label: "Orientadores",
      value: orientadores.length,
      note: "Profissionais ativos",
      icon: UsersRound,
      tint: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
      spotlight: "rgba(251, 191, 36, 0.18)",
    },
    {
      label: "Itens",
      value: items.length,
      note: "Tapetes e tecnologia",
      icon: Package,
      tint: "bg-fuchsia-400/15 text-fuchsia-300 ring-fuchsia-400/30",
      spotlight: "rgba(232, 121, 249, 0.18)",
    },
    {
      label: "Hoje",
      value: agendaToday.length,
      note: "Compromissos de hoje",
      icon: Activity,
      tint: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
      spotlight: "rgba(56, 189, 248, 0.18)",
    },
  ]

  const actionModules = user?.role === "orientador" ? orientadorModules : modules

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SpotlightCard
        spotlightColor="rgba(139, 92, 246, 0.22)"
        className="relative overflow-hidden rounded-3xl p-6 shadow-xl shadow-black/30 sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 size-72 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-sm text-muted-foreground capitalize">{today}</p>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Olá, <span className="text-gradient">{firstName}</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bem-vindo ao painel de controle escolar. Aqui você acompanha escolas, turmas,
              compromissos e muito mais.
            </p>
            <div className="mt-4">
              <Badge variant="outline" className="pointer-events-none gap-1.5 py-1">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {ROLE_LABELS[user?.role ?? "admin"]}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button render={<Link href="/schools" />} variant="outline" size="lg">
              <Building2 className="size-4 mr-2" />
              Ver escolas
            </Button>
            <Button render={<Link href="/agenda" />} size="lg">
              <CalendarDays className="size-4 mr-2" />
              Ver agenda
            </Button>
          </div>
        </div>
      </SpotlightCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Módulos do sistema
          </h2>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Atalhos rápidos para cada área
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {actionModules.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href} className="group">
                <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:bg-primary/[0.06] group-hover:shadow-lg group-hover:shadow-primary/10">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 transition-transform duration-300 group-hover:scale-110",
                      action.tint
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{action.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <SchoolIcon className="size-4 text-primary" />
              Escolas em destaque
            </CardTitle>
            <Link
              href="/schools"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Ver todas
              <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {schoolOverview.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Building2 className="size-7" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nenhuma escola cadastrada</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cadastre a primeira unidade para começar a usar o sistema.
                  </p>
                </div>
                <Button render={<Link href="/schools" />} size="sm">
                  <Plus className="size-4 mr-2" />
                  Cadastrar escola
                </Button>
              </div>
            ) : (
              schoolOverview.map(({ school, classes: classCount, students: studentCount, teams: teamCount }) => (
                <Link
                  key={school.id}
                  href={`/schools/${school.id}/classes`}
                  className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all duration-300 hover:border-primary/30 hover:bg-primary/[0.06]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/20 text-primary ring-1 ring-white/10">
                    <SchoolIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{school.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {[school.city, school.state].filter(Boolean).join(" · ") || school.region || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden text-center sm:block">
                      <p className="text-sm font-bold tabular-nums">{classCount}</p>
                      <p className="text-[10px] text-muted-foreground">turmas</p>
                    </div>
                    <div className="hidden text-center md:block">
                      <p className="text-sm font-bold tabular-nums">{studentCount}</p>
                      <p className="text-[10px] text-muted-foreground">alunos</p>
                    </div>
                    <div className="hidden text-center lg:block">
                      <p className="text-sm font-bold tabular-nums">{teamCount}</p>
                      <p className="text-[10px] text-muted-foreground">times</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Hoje
              </CardTitle>
              <Link
                href="/agenda"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                Agenda
                <ArrowUpRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {agendaToday.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <CalendarDays className="size-6" />
                  </div>
                  <p className="text-sm font-medium">Sem compromissos hoje</p>
                  <p className="text-xs text-muted-foreground">Aproveite o dia para organizar o planejamento.</p>
                  <Button
                    render={<Link href="/agenda" />}
                    variant="outline"
                    size="sm"
                    className="mt-1"
                  >
                    <Plus className="size-4 mr-2" />
                    Agendar
                  </Button>
                </div>
              ) : (
                <div className="relative flex flex-col gap-2">
                  <div className="absolute top-2 bottom-2 left-[13px] w-px bg-gradient-to-b from-primary/40 via-accent/30 to-transparent" />
                  {agendaToday.map((item) => (
                    <div key={item.id} className="relative flex items-start gap-3">
                      <div className="relative mt-1.5 shrink-0">
                        <span className="block size-[18px] rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent ring-1 ring-primary/30" />
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{item.activity}</p>
                          <span className="shrink-0 text-xs font-bold tabular-nums text-primary">
                            {formatTime(item.startTime)}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {formatTime(item.startTime)} - {formatTime(item.endTime)}
                          {item.orientadorIds.map((id) => orientadorName.get(id)).filter(Boolean)[0] && (
                            <span className="ml-1 truncate">
                              · {item.orientadorIds.map((id) => orientadorName.get(id)).filter(Boolean).join(", ")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                Próximos compromissos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum compromisso agendado.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {upcoming.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <DateBadge value={item.date} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.activity}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {formatTime(item.startTime)} - {formatTime(item.endTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DateBadge({ value }: { value: string }) {
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(d.getTime())) {
    return (
      <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
        <span className="text-[10px] font-semibold uppercase">-</span>
        <span className="text-sm leading-none font-bold">-</span>
      </div>
    )
  }
  const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
  const day = String(d.getDate()).padStart(2, "0")
  return (
    <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
      <span className="text-[10px] font-semibold uppercase">{month}</span>
      <span className="text-sm leading-none font-bold">{day}</span>
    </div>
  )
}