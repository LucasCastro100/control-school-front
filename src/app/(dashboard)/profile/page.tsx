"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { User, LoaderCircle, Save, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePageHeader } from "@/lib/page-header"
import { getSession, updateProfile } from "@/lib/db"
import type { AuthUser } from "@/lib/types"

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const { setHeader } = usePageHeader()

  useEffect(() => {
    getSession().then((session) => {
      setUser(session)
      setName(session?.name ?? "")
    })
  }, [])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <User className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Meu Perfil</h1>
      </div>,
      null
    )
  }, [])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const { error } = await updateProfile({ name: name.trim() })
    setSaving(false)
    if (error) {
      toast.error("Erro ao atualizar perfil.")
    } else {
      toast.success("Perfil atualizado com sucesso!")
    }
  }

  if (!user) return null

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Informações pessoais</CardTitle>
          <CardDescription>Atualize seu nome de exibição</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              value={user.email}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Perfil</Label>
            <Input
              value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              <Save className="size-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Link href="/profile/change-password">
              <Button variant="outline">
                <Lock className="size-4 mr-2" />
                Mudar senha
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
