"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { use } from "react"
import { useSearchParams } from "next/navigation"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { SchedulesSkeleton } from "@/components/skeletons/schedules-skeleton"
import type { School, DayOfWeek } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/types"
import {
  getSchool,
  getClassesBySchoolAndYear,
  getRooms,
  getSchedulesByClass,
  getAcademicYears,
} from "@/lib/db"

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "Segunda",
  1: "Terça",
  2: "Quarta",
  3: "Quinta",
  4: "Sexta",
  5: "Sábado",
}

const DAY_TINT = [
  "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30",
  "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  "bg-rose-500/15 text-rose-300 ring-rose-500/30",
]

interface ScheduleEntry {
  id: string
  className: string
  roomName: string
  subject: string
  startTime: string
  endTime: string
  teacher: string
  dayOfWeek: number
  fortnight?: 0 | 1 | 2
}

export default function GeneralSchedulesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={null}>
      <GeneralSchedulesContent params={params} />
    </Suspense>
  )
}

function GeneralSchedulesContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const [school, setSchool] = useState<School | null>(null)
  const [groupedByDay, setGroupedByDay] = useState<
    { day: DayOfWeek; schedules: ScheduleEntry[] }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState(searchParams.get("year") || String(new Date().getFullYear()))
  const [academicYears, setAcademicYears] = useState<string[]>([])
  const { setHeader } = usePageHeader()

  useEffect(() => {
    getAcademicYears().then((years) => {
      setAcademicYears(years)
      if (years.length > 0 && !years.includes(filterYear)) {
        setFilterYear(years[years.length - 1])
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const schoolData = await getSchool(id)
      if (cancelled) return
      setSchool(schoolData ?? null)

      if (schoolData) {
        const [allRooms, classList] = await Promise.all([
          getRooms(),
          getClassesBySchoolAndYear(id, filterYear),
        ])
        if (cancelled) return
        const roomMap = new Map(allRooms.map((r) => [r.id, r]))

        const entries: ScheduleEntry[] = []

        for (const cls of classList) {
          const schedules = await getSchedulesByClass(cls.id)
          if (cancelled) return
          for (const schedule of schedules) {
            entries.push({
              id: schedule.id,
              className: cls.name,
              roomName: roomMap.get(schedule.roomId)?.name ?? schedule.roomId,
              subject: schedule.subject,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              teacher: schedule.teacher,
              dayOfWeek: schedule.dayOfWeek,
              fortnight: schedule.fortnight,
            })
          }
        }

        const grouped = DAYS_OF_WEEK.map((_, idx) => ({
          day: DAY_MAP[idx],
          schedules: entries
            .filter((e) => e.dayOfWeek === idx)
            .sort((a, b) => a.startTime.localeCompare(b.startTime)),
        }))

        setGroupedByDay(grouped)
      }

      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, filterYear])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <Calendar className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">
          Horários Gerais - {school?.name}
        </h1>
      </div>,
      null
    )
  }, [school?.name, id])

  if (loading) return <SchedulesSkeleton />

  const hasAny = groupedByDay.some((g) => g.schedules.length > 0)

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
        <Link
          href={"/schools/" + id + "/classes"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {school?.name}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">Horários Gerais</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Ano Letivo:</Label>
          <SearchableSelect
            options={academicYears.map((y) => ({ value: y, label: y }))}
            value={filterYear}
            onChange={(v) => v && setFilterYear(v)}
            placeholder="Selecione o ano"
            searchPlaceholder="Buscar ano..."
            emptyText="Nenhum ano encontrado."
          />
        </div>
      </div>

      {!hasAny ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhum horário cadastrado para {filterYear} nesta escola.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  {school?.scheduleType === "quinzenal" && <TableHead>Quinzena</TableHead>}
                  <TableHead>Turma</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Professor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedByDay.map(({ day, schedules }, idx) =>
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${DAY_TINT[idx % DAY_TINT.length]}`}
                        >
                          {day}
                        </span>
                      </TableCell>
                      {school?.scheduleType === "quinzenal" && (
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              schedule.fortnight === 2
                                ? "bg-orange-500/15 text-orange-300"
                                : "bg-blue-500/15 text-blue-300"
                            }`}
                          >
                            Quinzena {schedule.fortnight ?? 1}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{schedule.className}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-auto">
                          {schedule.roomName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-semibold tabular-nums">
                          <Clock className="size-3.5 text-muted-foreground" />
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{schedule.subject}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-auto">
                          {schedule.teacher}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
