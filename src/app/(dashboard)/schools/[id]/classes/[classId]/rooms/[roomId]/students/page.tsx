"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Plus, Pencil, Trash2, Users, LoaderCircle } from "lucide-react"
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
import { usePageHeader } from "@/lib/page-header"
import type { Student, Room, Class, School } from "@/lib/types"
import {
  getSchool,
  getClass,
  getRoom,
  getStudentsByRoom,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/lib/db"

export default function StudentsPage({
  params,
}: {
  params: Promise<{ id: string; classId: string; roomId: string }>
}) {
  const { id, classId, roomId } = use(params)
  const router = useRouter()
  const [school, setSchool] = useState<School | null>(null)
  const [cls, setCls] = useState<Class | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [open, setOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(
    null
  )
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [name, setName] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const { setHeader } = usePageHeader()

  useEffect(() => {
    async function load() {
      const [schoolData, classData, roomData, studentsData] = await Promise.all([
        getSchool(id),
        getClass(classId),
        getRoom(roomId),
        getStudentsByRoom(roomId),
      ])
      setSchool(schoolData ?? null)
      setCls(classData ?? null)
      setRoom(roomData ?? null)
      setStudents(studentsData)
    }
    load()
  }, [id, classId, roomId])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <Users className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Alunos - {room?.name} {cls?.year ? `(${cls.year})` : ""}</h1>
      </div>,
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-2" />
        Novo Aluno
      </Button>
    )
  }, [room?.name])

  async function refresh() {
    const studentsData = await getStudentsByRoom(roomId)
    setStudents(studentsData)
    router.refresh()
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingStudent(null)
      setName("")
      setRegistrationNumber("")
    }
  }

  function handleEdit(student: Student) {
    setEditingStudent(student)
    setName(student.name)
    setRegistrationNumber(student.registrationNumber)
    setOpen(true)
  }

  async function handleSave() {
    if (!name.trim() || !registrationNumber.trim()) return
    setSaving(true)
    if (editingStudent) {
      await updateStudent(editingStudent.id, {
        name: name.trim(),
        registrationNumber: registrationNumber.trim(),
      })
    } else {
      await createStudent({
        roomId,
        name: name.trim(),
        registrationNumber: registrationNumber.trim(),
      })
    }
    handleOpenChange(false)
    setSaving(false)
    refresh()
  }

  function handleDelete(studentId: string, label: string) {
    setDeleteTarget({ id: studentId, label })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteStudent(deleteTarget.id)
    setDeleteTarget(null)
    refresh()
  }

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
        <Link
          href={`/schools/${id}/classes/${classId}/rooms`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {cls?.name}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">{room?.name}</span>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Editar Aluno" : "Novo Aluno"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do aluno"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="registration">
                Matrícula
              </Label>
              <Input
                id="registration"
                value={registrationNumber}
                onChange={(e) =>
                  setRegistrationNumber(e.target.value)
                }
                placeholder="Número de matrícula"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {editingStudent ? "Salvar" : "Criar"}
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
            Tem certeza que deseja excluir o aluno <strong>{deleteTarget?.label}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Alunos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum aluno cadastrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.name || "-"}
                    </TableCell>
                    <TableCell>
                      {student.registrationNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(student)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() =>
                              handleDelete(student.id, student.name)
                            }
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
