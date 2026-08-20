"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { use } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
        <Link href={"/schools/" + id + "/classes"}>
          <Button variant="ghost" size="icon" className="size-7">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedByDay.map(({ day, schedules }, idx) => {
            if (schedules.length === 0) return null

            return (
              <Card key={day} className="pt-0 h-fit">
                <CardHeader className={`bg-gradient-to-r ${[
                  "from-primary/20 to-secondary/10",
                  "from-secondary/20 to-accent/10",
                  "from-accent/20 to-primary/10",
                  "from-chart-4/20 to-secondary/10",
                  "from-chart-5/20 to-accent/10",
                  "from-primary/15 to-chart-4/10",
                ][idx % 6]} rounded-t-xl items-center pt-(--card-spacing)`}>
                  <CardTitle className="text-lg">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="rounded-lg border p-3 border-l-transparent hover:border-l-primary/50 transition-colors flex flex-col gap-1"
                        style={{
                          borderLeftColor:
                            school?.scheduleType === "quinzenal"
                              ? schedule.fortnight === 2
                                ? "oklch(0.62 0.22 25)"
                                : "oklch(0.62 0.2 245)"
                              : school?.color || `oklch(0.62 0.22 ${275 + schedule.dayOfWeek * 20})`,
                        }}
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {school?.color && school?.scheduleType !== "quinzenal" && (
                            <span
                              className="inline-block size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: school.color }}
                            />
                          )}
                          {school?.scheduleType === "quinzenal" && (
                            <span
                              className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                schedule.fortnight === 2
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              Q{schedule.fortnight ?? 1}
                            </span>
                          )}
                          <span className="font-medium truncate">{schedule.className}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-auto">
                            {schedule.roomName}
                          </Badge>
                        </div>
                        <span className="font-medium text-sm">{schedule.subject}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-auto">
                            {schedule.teacher}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
