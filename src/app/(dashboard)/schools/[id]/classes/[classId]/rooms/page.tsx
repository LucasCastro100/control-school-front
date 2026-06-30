"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Plus, Pencil, Trash2, Users, DoorOpen } from "lucide-react"
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
import type { Room, Class, School } from "@/lib/types"
import {
  getSchool,
  getClass,
  getRoomsByClass,
  createRoom,
  updateRoom,
  deleteRoom,
} from "@/lib/db"

export default function RoomsPage({
  params,
}: {
  params: Promise<{ id: string; classId: string }>
}) {
  const { id, classId } = use(params)
  const router = useRouter()
  const [school, setSchool] = useState<School | null>(null)
  const [cls, setCls] = useState<Class | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [open, setOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [name, setName] = useState("")
  const { setHeader } = usePageHeader()

  useEffect(() => {
    setSchool(getSchool(id) ?? null)
    setCls(getClass(classId) ?? null)
    setRooms(getRoomsByClass(classId))
  }, [id, classId])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <DoorOpen className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Salas - {cls?.name}</h1>
      </div>,
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-2" />
        Nova Sala
      </Button>
    )
  }, [cls?.name])

  function refresh() {
    setRooms(getRoomsByClass(classId))
    router.refresh()
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (!open) {
      setEditingRoom(null)
      setName("")
    }
  }

  function handleEdit(room: Room) {
    setEditingRoom(room)
    setName(room.name)
    setOpen(true)
  }

  function handleSave() {
    if (!name.trim()) return
    if (editingRoom) {
      updateRoom(editingRoom.id, { name: name.trim() })
    } else {
      createRoom({ classId, name: name.trim() })
    }
    handleOpenChange(false)
    refresh()
  }

  function handleDelete(roomId: string) {
    if (confirm("Tem certeza que deseja excluir esta sala?")) {
      deleteRoom(roomId)
      refresh()
    }
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
        <span className="text-sm">{cls?.name}</span>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Editar Sala" : "Nova Sala"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome da Sala</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: 1A, 1B"
              />
            </div>
            <Button onClick={handleSave}>
              {editingRoom ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Salas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma sala cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sala</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">
                      {room.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link
                          href={`/schools/${id}/classes/${classId}/rooms/${room.id}/students`}
                        >
                          <Button variant="outline" size="icon">
                            <Users className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(room)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(room.id)}
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
