"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, LoaderCircle, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActionTooltip } from "@/components/ui/action-tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { Role, User } from "@/lib/types"
import {
  getRoles,
  getSchoolUsers,
  getUsers,
  createUser,
  addUserSchool,
  removeUserSchool,
} from "@/lib/db"
import {
  NAP_OPTIONS,
  roleDisplayName,
  roleTint,
  userNap,
  findRoleByName,
} from "@/lib/user-meta"
import { cn } from "@/lib/utils"

type AccountLevel = "orientador" | "professor" | "diretor" | "coordenador" | "escola"

type PendingAccount = {
  key: string
  name: string
  email: string
  password: string
  level: AccountLevel
  nap: string | null
  existingUserId?: string
}

function needsFixedNap(level: AccountLevel): boolean {
  return level === "professor" || level === "coordenador"
}

const ACCOUNT_TYPE_OPTIONS: Record<
  AccountLevel,
  { label: string; role: User["role"]; roleName: string }
> = {
  orientador: { label: "Orientador", role: "orientador", roleName: "Orientador" },
  professor: { label: "Professor", role: "professor", roleName: "Professor" },
  diretor: { label: "Diretor(a)", role: "escola", roleName: "Diretor(a)" },
  coordenador: { label: "Coordenador(a)", role: "escola", roleName: "Coordenador(a)" },
  escola: { label: "Acesso da escola", role: "escola", roleName: "Escola" },
}

const ACCOUNT_LEVEL_OPTIONS: { value: AccountLevel; label: string }[] = (
  ["professor", "coordenador", "diretor", "orientador"] as AccountLevel[]
).map((k) => ({
  value: k,
  label: ACCOUNT_TYPE_OPTIONS[k].label,
}))
export function SchoolAccountsView({ schoolId }: { schoolId: string }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [linkedUsers, setLinkedUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([])
  const [removedUserIds, setRemovedUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [accName, setAccName] = useState("")
  const [accEmail, setAccEmail] = useState("")
  const [accPassword, setAccPassword] = useState("")
  const [accLevel, setAccLevel] = useState<AccountLevel>("diretor")
  const [accNap, setAccNap] = useState("NAP 1")
  const [showAccPassword, setShowAccPassword] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [rs, users, all] = await Promise.all([getRoles(), getSchoolUsers(schoolId), getUsers()])
      setRoles(rs)
      setLinkedUsers(users)
      setAllUsers(all)
      setPendingAccounts([])
      setRemovedUserIds([])
      setLoading(false)
    }
    load()
  }, [schoolId])

  function existingUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase()
    return allUsers.find((u) => u.email.trim().toLowerCase() === normalized)
  }

  function napCount(nap: string): number {
    const existing = linkedUsers.filter(
      (u) => !removedUserIds.includes(u.id) && userNap(u, schoolId) === nap
    ).length
    const pending = pendingAccounts.filter((a) => a.nap === nap).length
    return existing + pending
  }

  function remainingNapSlots(nap: string): number {
    return Math.max(0, 2 - napCount(nap))
  }

  function resetAddForm() {
    setAccName("")
    setAccEmail("")
    setAccPassword("")
    setAccLevel("diretor")
    setAccNap("NAP 1")
    setShowAccPassword(false)
  }

  function addPendingAccount() {
    if (!accName.trim() || !accEmail.trim()) {
      toast.error("Preencha nome e email da conta de acesso.")
      return
    }
    const fixedNap = needsFixedNap(accLevel)
    if (fixedNap && napCount(accNap) >= 2) {
      toast.error(`Limite de 2 usuário(s) por NAP atingido em ${accNap}.`)
      return
    }
    const existing = existingUserByEmail(accEmail)
    const alreadyPending = pendingAccounts.some(
      (a) => a.email.trim().toLowerCase() === accEmail.trim().toLowerCase()
    )
    if (alreadyPending) {
      toast.error("Este email já está na lista de contas abaixo.")
      return
    }
    setPendingAccounts((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        name: accName.trim(),
        email: accEmail.trim(),
        password: accPassword,
        level: accLevel,
        nap: needsFixedNap(accLevel) ? accNap : null,
        existingUserId: existing?.id,
      },
    ])
    setAddOpen(false)
    resetAddForm()
    if (existing) {
      toast.info(
        `O email já está cadastrado (${existing.name}). A conta será vinculada a esta escola.`
      )
    }
  }

  function removePendingAccount(key: string) {
    setPendingAccounts((prev) => prev.filter((a) => a.key !== key))
  }

  function unlinkUser(userId: string) {
    setRemovedUserIds((prev) => [...prev, userId])
  }

  function restoreUser(userId: string) {
    setRemovedUserIds((prev) => prev.filter((id) => id !== userId))
  }

  async function persistAccounts(schoolIdToPersist: string) {
    for (const userId of removedUserIds) {
      await removeUserSchool(userId, schoolIdToPersist)
    }
    for (const acc of pendingAccounts) {
      const type = ACCOUNT_TYPE_OPTIONS[acc.level]
      const roleId = findRoleByName(roles, type.roleName)?.id ?? ""
      const created = await createUser({
        name: acc.name,
        email: acc.email,
        password: acc.password.trim() || "mudar123",
        role: type.role,
        roleId: roleId || null,
      })
      await addUserSchool(created.id, schoolIdToPersist, acc.nap ?? undefined)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await persistAccounts(schoolId)
      toast.success("Contas de acesso salvas com sucesso!")
      setLinkedUsers(await getSchoolUsers(schoolId))
      setPendingAccounts([])
      setRemovedUserIds([])
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message : "Erro ao salvar contas de acesso."
      )
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Crie as contas de diretor(a), coordenador(a), professor(a) ou orientador(a) para a
          escola (máx. 2 usuários por NAP).
        </p>

        <div className="flex flex-wrap gap-1.5">
          {NAP_OPTIONS.map((nap) => {
            const remaining = remainingNapSlots(nap)
            return (
              <span
                key={nap}
                className={cn(
                  "text-xs rounded-full px-2 py-0.5 font-medium",
                  remaining === 0 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                )}
              >
                {nap}: {remaining} vaga{remaining !== 1 ? "s" : ""}
              </span>
            )
          })}
        </div>

        {(linkedUsers.some((u) => !removedUserIds.includes(u.id)) || pendingAccounts.length > 0) && (
          <div className="flex flex-col gap-1 rounded-md border p-2">
            {linkedUsers
              .filter((u) => !removedUserIds.includes(u.id))
              .map((u) => {
                const nap = userNap(u, schoolId)
                return (
                  <div key={u.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                          roleTint(u.role)
                        )}
                      >
                        {roleDisplayName(u)}
                      </span>
                      <span className="truncate font-medium">{u.name}</span>
                      <span className="truncate text-muted-foreground">{u.email}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                          nap ? "bg-violet-400/15 text-violet-300" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {nap || "Sem NAP"}
                      </span>
                    </div>
                    <ActionTooltip label="Excluir conta">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => unlinkUser(u.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </ActionTooltip>
                  </div>
                )
              })}
            {pendingAccounts.map((a) => (
              <div key={a.key} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                      roleTint(ACCOUNT_TYPE_OPTIONS[a.level].role)
                    )}
                  >
                    {ACCOUNT_TYPE_OPTIONS[a.level].label}
                  </span>
                  <span className="truncate font-medium">{a.name}</span>
                  <span className="truncate text-muted-foreground">{a.email}</span>
                  <span className="inline-flex items-center rounded-full bg-violet-400/15 px-2 py-0.5 text-xs text-violet-300">
                    {a.nap ?? "Escola"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                    <LoaderCircle className="size-3 animate-spin" /> novo
                  </span>
                </div>
                <ActionTooltip label="Excluir conta">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => removePendingAccount(a.key)}
                  >
                    <X className="size-3" />
                  </Button>
                </ActionTooltip>
              </div>
            ))}
          </div>
        )}

        {removedUserIds.length > 0 && (
          <div className="flex flex-col gap-1">
            {linkedUsers
              .filter((u) => removedUserIds.includes(u.id))
              .map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm opacity-60">
                  <span className="truncate">{u.name} (será desvinculado)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => restoreUser(u.id)}
                  >
                    Desfazer
                  </Button>
                </div>
              ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4 mr-2" />
            Adicionar conta
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o)
          if (!o) resetAddForm()
        }}
      >
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Nova conta de acesso</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="accName">Nome</Label>
              <Input
                id="accName"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="accEmail">Email</Label>
              <Input
                id="accEmail"
                type="email"
                value={accEmail}
                onChange={(e) => setAccEmail(e.target.value)}
                placeholder="Email para login"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="accPassword">Senha de acesso</Label>
              <div className="relative">
                <Input
                  id="accPassword"
                  type={showAccPassword ? "text" : "password"}
                  value={accPassword}
                  onChange={(e) => setAccPassword(e.target.value)}
                  placeholder="Senha (padrão: mudar123)"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowAccPassword(!showAccPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showAccPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Tipo</Label>
                <SearchableSelect
                  options={ACCOUNT_LEVEL_OPTIONS}
                  value={accLevel}
                  onChange={(v) => v && setAccLevel(v as AccountLevel)}
                  placeholder="Tipo"
                  searchPlaceholder="Buscar tipo..."
                  emptyText="Nenhum tipo encontrado."
                />
              </div>
              {needsFixedNap(accLevel) ? (
                <div className="flex flex-col gap-2">
                  <Label>NAP</Label>
                  <SearchableSelect
                    options={NAP_OPTIONS.map((nap) => ({
                      value: nap,
                      label: `${nap}${remainingNapSlots(nap) === 0 ? " (cheio)" : ""}`,
                    }))}
                    value={accNap}
                    onChange={(v) => v && setAccNap(v)}
                    placeholder="NAP"
                    searchPlaceholder=""
                    emptyText=""
                  />
                </div>
              ) : (
                <div className="flex items-end pb-1 text-xs text-muted-foreground">
                  Acesso à escola inteira (todos os NAPs).
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={addPendingAccount}>
                <UserPlus className="size-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}