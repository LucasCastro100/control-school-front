"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { User, LoaderCircle, Save, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePageHeader } from "@/lib/page-header"
import { getSession, updateProfile, getMundozCredentials, updateMundozCredentials } from "@/lib/db"
import type { AuthUser } from "@/lib/types"

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [mundozUser, setMundozUser] = useState("")
  const [mundozPassword, setMundozPassword] = useState("")
  const [useSystemEmail, setUseSystemEmail] = useState(false)
  const [mundozLoaded, setMundozLoaded] = useState(false)
  const [savingMundoz, setSavingMundoz] = useState(false)
  const { setHeader } = usePageHeader()

  useEffect(() => {
    getSession().then(async (session) => {
      setUser(session)
      setName(session?.name ?? "")
      if (session?.userId) {
        const creds = await getMundozCredentials(session.userId)
        if (creds) {
          setMundozUser(creds.mundozUser)
          setMundozPassword(creds.mundozPassword)
          setUseSystemEmail(!!creds.mundozUser && creds.mundozUser === session.email)
        }
      }
      setMundozLoaded(true)
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

  async function handleSaveMundoz() {
    if (!user?.userId) return
    setSavingMundoz(true)
    const userValue = useSystemEmail ? user.email : mundozUser.trim()
    const ok = await updateMundozCredentials(user.userId, {
      mundozUser: userValue || null,
      mundozPassword: mundozPassword || null,
    })
    setSavingMundoz(false)
    if (ok) {
      toast.success("Credenciais do MundoZ salvas!")
    } else {
      toast.error("Erro ao salvar credenciais do MundoZ.")
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

      <Card>
        <CardHeader>
          <CardTitle>Acesso ao MundoZ</CardTitle>
          <CardDescription>
            Usado pela automação para registrar monitoramentos na plataforma MundoZ.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <Checkbox
              checked={useSystemEmail}
              onCheckedChange={(v) => {
                setUseSystemEmail(!!v)
                if (v) setMundozUser(user.email)
              }}
              aria-label="Usar meu email do sistema"
              className="mt-0.5"
            />
            <span className="text-muted-foreground">
              Meu usuário no MundoZ é o mesmo email de acesso do sistema
            </span>
          </label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mundozUser">Usuário no MundoZ</Label>
            <Input
              id="mundozUser"
              value={useSystemEmail ? user.email : mundozUser}
              onChange={(e) => setMundozUser(e.target.value)}
              disabled={useSystemEmail}
              placeholder="email ou usuário da plataforma"
              className={useSystemEmail ? "bg-muted" : ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mundozPassword">Senha no MundoZ</Label>
            <Input
              id="mundozPassword"
              type="password"
              value={mundozPassword}
              onChange={(e) => setMundozPassword(e.target.value)}
              placeholder="senha da plataforma"
            />
            <p className="text-xs text-muted-foreground">
              Necessária para a automação acessar a plataforma (fica salva apenas para isso).
            </p>
          </div>
          {mundozLoaded && (
            <Button onClick={handleSaveMundoz} disabled={savingMundoz || (!useSystemEmail && !mundozUser.trim())}>
              {savingMundoz && <LoaderCircle className="size-4 animate-spin" />}
              <Save className="size-4 mr-2" />
              {savingMundoz ? "Salvando..." : "Salvar credenciais"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
