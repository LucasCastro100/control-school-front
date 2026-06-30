"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { use } from "react"
import { ArrowLeft, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePageHeader } from "@/lib/page-header"
import type { School, DayOfWeek } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/types"
import {
  getSchool,
  getClassesBySchool,
  getRooms,
  getSchedulesByClass,
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
}

export default function GeneralSchedulesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [school, setSchool] = useState<School | null>(null)
  const [groupedByDay, setGroupedByDay] = useState<
    { day: DayOfWeek; schedules: ScheduleEntry[] }[]
  >([])
  const [loading, setLoading] = useState(true)
  const { setHeader } = usePageHeader()

  useEffect(() => {
    const schoolData = getSchool(id)
    setSchool(schoolData ?? null)

    if (schoolData) {
      const allRooms = getRooms()
      const roomMap = new Map(allRooms.map((r) => [r.id, r]))
      const classList = getClassesBySchool(id)

      const entries: ScheduleEntry[] = []

      for (const cls of classList) {
        const schedules = getSchedulesByClass(cls.id)
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
  }, [id])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

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

      {!hasAny ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhum horário cadastrado nas turmas desta escola.
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
                        style={{ borderLeftColor: school?.color || `oklch(0.62 0.22 ${275 + schedule.dayOfWeek * 20})` }}
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {school?.color && (
                            <span
                              className="inline-block size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: school.color }}
                            />
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
