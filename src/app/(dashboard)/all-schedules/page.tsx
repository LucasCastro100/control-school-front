"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { usePageHeader } from "@/lib/page-header"
import { SchedulesSkeleton } from "@/components/skeletons/schedules-skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { DayOfWeek } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/types"
import {
  getSchools,
  getClasses,
  getRooms,
  getSchedules,
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
  schoolName: string
  schoolColor: string
  roomName: string
  className: string
  subject: string
  startTime: string
  endTime: string
  teacher: string
  dayOfWeek: number
}

export default function AllSchedulesPage() {
  const [loading, setLoading] = useState(true)
  const [groupedByDay, setGroupedByDay] = useState<
    { day: DayOfWeek; schedules: ScheduleEntry[] }[]
  >([])
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [academicYears, setAcademicYears] = useState<string[]>([])
  const { setHeader } = usePageHeader()

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <Calendar className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Horário Geral de Todas as Escolas</h1>
      </div>,
      null
    )
  }, [setHeader])

  useEffect(() => {
    async function load() {
      const years = await getAcademicYears()
      setAcademicYears(years)
    }
    load()
  }, [])

  useEffect(() => {
    async function load() {
      const schools = await getSchools()
      const allClasses = (await getClasses()).filter((c) => c.year === filterYear)
      const allRooms = await getRooms()
      const allSchedules = await getSchedules()

      const schoolMap = new Map(schools.map((s) => [s.id, s]))
      const classMap = new Map(allClasses.map((c) => [c.id, c]))
      const roomMap = new Map(allRooms.map((r) => [r.id, r]))

      const entries: ScheduleEntry[] = []

      for (const schedule of allSchedules) {
        const cls = classMap.get(schedule.classId)
        if (!cls) continue
        const school = schoolMap.get(cls.schoolId)
        if (!school) continue
        const room = roomMap.get(schedule.roomId)

        entries.push({
          id: schedule.id,
          schoolName: school.name,
          schoolColor: school.color ?? "",
          roomName: room?.name ?? schedule.roomId,
          className: cls.name,
          subject: schedule.subject,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          teacher: schedule.teacher,
          dayOfWeek: schedule.dayOfWeek,
        })
      }

      const grouped = DAYS_OF_WEEK.map((_, idx) => ({
        day: DAY_MAP[idx],
        schedules: entries
          .filter((e) => e.dayOfWeek === idx)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }))

      setGroupedByDay(grouped)
      setLoading(false)
    }
    load()
  }, [filterYear])

  if (loading) return <SchedulesSkeleton />

  const hasAny = groupedByDay.some((g) => g.schedules.length > 0)

  if (!hasAny) {
    return (
      <>
        <div className="mb-4">
          <SearchableSelect
            options={academicYears.map((y) => ({ value: y, label: y }))}
            value={filterYear}
            onChange={(v) => v && setFilterYear(v)}
            placeholder="Selecione o ano"
            searchPlaceholder="Buscar ano..."
            emptyText="Nenhum ano encontrado."
          />
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhum horário cadastrado para {filterYear} em nenhuma escola.
            </p>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="mb-4">
        <SearchableSelect
          options={academicYears.map((y) => ({ value: y, label: y }))}
          value={filterYear}
          onChange={(v) => v && setFilterYear(v)}
          placeholder="Selecione o ano"
          searchPlaceholder="Buscar ano..."
          emptyText="Nenhum ano encontrado."
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia</TableHead>
                <TableHead>Escola</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: schedule.schoolColor || `oklch(0.62 0.22 ${275 + schedule.dayOfWeek * 20})` }}
                        />
                        <span className="font-medium">{schedule.schoolName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {schedule.className}
                    </TableCell>
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
    </>
  )
}
