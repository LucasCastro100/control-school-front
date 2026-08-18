"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Plus, Pencil, Trash2, Calendar, LoaderCircle } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Badge } from "@/components/ui/badge"
import { usePageHeader } from "@/lib/page-header"
import type { Schedule, Class, School, Room, DayOfWeek } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/types"
import {
  getSchool,
  getClass,
  getRoomsByClass,
  getSchedulesByRoom,
  getSchedulesByClass,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/lib/db"

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "Segunda",
  1: "Terça",
  2: "Quarta",
  3: "Quinta",
  4: "Sexta",
  5: "Sábado",
}

export default function SchedulesPage({
  params,
}: {
  params: Promise<{ id: string; classId: string }>
}) {
  const { id, classId } = use(params)
  const router = useRouter()
  const [school, setSchool] = useState<School | null>(null)
  const [cls, setCls] = useState<Class | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState("")
  const { setHeader } = usePageHeader()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [open, setOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] =
    useState<Schedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [formRoom, setFormRoom] = useState("")
  const [dayOfWeek, setDayOfWeek] = useState("0")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [subject, setSubject] = useState("")
  const [teacher, setTeacher] = useState("")
  const [fortnight, setFortnight] = useState("1")

  useEffect(() => {
    async function load() {
      const schoolData = await getSchool(id)
      const classData = await getClass(classId)
      const roomList = await getRoomsByClass(classId)
      setSchool(schoolData ?? null)
      setCls(classData ?? null)
      setRooms(roomList)
      if (roomList.length > 0 && !selectedRoom) {
        setSelectedRoom("all")
      }
    }
    load()
  }, [id, classId])

  useEffect(() => {
    async function load() {
      if (selectedRoom === "all") {
        setSchedules(await getSchedulesByClass(classId))
      } else if (selectedRoom) {
        setSchedules(await getSchedulesByRoom(selectedRoom))
      } else {
        setSchedules([])
      }
    }
    load()
  }, [selectedRoom, classId])

  async function refresh() {
    if (selectedRoom === "all") {
      setSchedules(await getSchedulesByClass(classId))
    } else if (selectedRoom) {
      setSchedules(await getSchedulesByRoom(selectedRoom))
    }
    router.refresh()
  }

  function handleRoomChange(value: string) {
    setSelectedRoom(value)
  }

  async function confirmDeleteSchedule() {
    if (!deleteTarget) return
    await deleteSchedule(deleteTarget.id)
    setDeleteTarget(null)
    await refresh()
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingSchedule(null)
      setFormRoom("")
      setDayOfWeek("0")
      setStartTime("")
      setEndTime("")
      setSubject("")
      setTeacher("")
      setFortnight("1")
    } else {
      setFormRoom(selectedRoom === "all" ? "" : selectedRoom)
    }
  }

  function handleEdit(schedule: Schedule) {
    setEditingSchedule(schedule)
    setFormRoom(schedule.roomId)
    setDayOfWeek(String(schedule.dayOfWeek))
    setStartTime(schedule.startTime)
    setEndTime(schedule.endTime)
    setSubject(schedule.subject)
    setTeacher(schedule.teacher)
    setFortnight(String(schedule.fortnight ?? 1))
    setOpen(true)
  }

  async function handleSave() {
    if (!startTime || !endTime || !subject.trim() || !teacher.trim() || !formRoom)
      return
    setSaving(true)
    setTimeout(async () => {
      const fortnightValue: 0 | 1 | 2 =
        school?.scheduleType === "quinzenal"
          ? fortnight === "2" ? 2 : 1
          : 0
      const data = {
        classId,
        roomId: formRoom,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        subject: subject.trim(),
        teacher: teacher.trim(),
        fortnight: fortnightValue,
      }
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data)
      } else {
        await createSchedule(data)
      }
      handleOpenChange(false)
      setSaving(false)
      await refresh()
    }, 0)
  }

  const groupedSchedules = DAYS_OF_WEEK.map((_, idx) => ({
    day: DAY_MAP[idx],
    schedules: schedules
      .filter((s) => s.dayOfWeek === idx)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }))

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <Calendar className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Horários - {cls?.name} {cls?.year ? `(${cls.year})` : ""}</h1>
      </div>,
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-2" />
        Novo Horário
      </Button>
    )
  }, [cls?.name])

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
          href={`/schools/${id}/classes`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {school?.name}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">{cls?.name} - Horários</span>
      </div>

      {rooms.length > 0 && (
        <div className="mb-6">
          <SearchableSelect
            options={[
              { value: "all", label: "Todas as Salas" },
              ...rooms.map((room) => ({
                value: room.id,
                label: room.name,
              })),
            ]}
            value={selectedRoom}
            onChange={handleRoomChange}
            placeholder="Todas as Salas"
            searchPlaceholder="Buscar sala..."
            emptyText="Nenhuma sala encontrada."
          />
        </div>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
              <DialogTitle>
                {editingSchedule
                  ? "Editar Horário"
                  : "Novo Horário"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Sala</Label>
                <SearchableSelect
                  options={rooms.map((room) => ({
                    value: room.id,
                    label: room.name,
                  }))}
                  value={formRoom}
                  onChange={setFormRoom}
                  placeholder="Selecione a sala"
                  searchPlaceholder="Buscar sala..."
                  emptyText="Nenhuma sala encontrada."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="day">Dia da Semana</Label>
                <SearchableSelect
                  options={DAYS_OF_WEEK.map((day, idx) => ({
                    value: String(idx),
                    label: day,
                  }))}
                  value={dayOfWeek}
                  onChange={setDayOfWeek}
                  placeholder="Selecione o dia"
                  searchPlaceholder="Buscar dia..."
                  emptyText="Nenhum dia encontrado."
                />
              </div>
              {school?.scheduleType === "quinzenal" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fortnight">Quinzena</Label>
                  <SearchableSelect
                    options={[
                      { value: "1", label: "Quinzena 1" },
                      { value: "2", label: "Quinzena 2" },
                    ]}
                    value={fortnight}
                    onChange={(v) => v && setFortnight(v)}
                    placeholder="Selecione a quinzena"
                    searchPlaceholder="Buscar quinzena..."
                    emptyText="Nenhuma quinzena encontrada."
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="startTime">
                    Horário Início
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) =>
                      setStartTime(e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="endTime">
                    Horário Fim
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="subject">Disciplina</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Matemática"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="teacher">Professor</Label>
                <Input
                  id="teacher"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  placeholder="Nome do professor"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <LoaderCircle className="size-4 animate-spin" />}
                {editingSchedule ? "Salvar" : "Criar"}
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
            Tem certeza que deseja excluir o horário <strong>{deleteTarget?.label}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteSchedule}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {!selectedRoom ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nenhuma sala cadastrada para esta turma. Crie uma sala primeiro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {groupedSchedules.map(({ day, schedules }, idx) => (
            <Card key={day} className="pt-0">
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
                {schedules.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhum horário
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-start justify-between rounded-lg border p-3 border-l-transparent hover:border-l-primary/50 transition-colors"
                        style={{
                          borderLeftColor:
                            school?.scheduleType === "quinzenal"
                              ? schedule.fortnight === 2
                                ? "oklch(0.62 0.22 25)"
                                : "oklch(0.62 0.2 245)"
                              : `oklch(0.62 0.22 ${275 + schedule.dayOfWeek * 20})`,
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          {selectedRoom === "all" && (
                            <Badge variant="default" className="w-fit mb-1">
                              {rooms.find((r) => r.id === schedule.roomId)?.name ?? schedule.roomId}
                            </Badge>
                          )}
                          {school?.scheduleType === "quinzenal" && (
                            <span
                              className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                schedule.fortnight === 2
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              Quinzena {schedule.fortnight ?? 1}
                            </span>
                          )}
                          <span className="font-medium">
                            {schedule.subject}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {schedule.startTime} -{" "}
                            {schedule.endTime}
                          </span>
                          <Badge
                            variant="secondary"
                            className="w-fit"
                          >
                            {schedule.teacher}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                              handleEdit(schedule)
                            }
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setDeleteTarget({ id: schedule.id, label: `${schedule.subject} (${schedule.startTime}-${schedule.endTime})` })}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
