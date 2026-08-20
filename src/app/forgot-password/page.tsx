"use client"

import { useState } from "react"
import Link from "next/link"
import { GraduationCap, Mail, ArrowLeft, LoaderCircle, CheckCircle } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/db"

const schema = z.object({
  email: z.string().min(1, "Email é obrigatório.").email("Email inválido."),
})

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const result = schema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)
    const { error: resetError } = await resetPassword(result.data.email.trim())
    setLoading(false)

    if (resetError) {
      setError("Erro ao enviar email. Tente novamente.")
    } else {
      setSent(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[oklch(0.12_0.025_265)] via-[oklch(0.14_0.03_280)] to-[oklch(0.12_0.025_250)] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>
      <Card className="w-full max-w-sm relative">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <GraduationCap className="size-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl">Esqueci a senha</CardTitle>
          <CardDescription>
            {sent
              ? "Verifique sua caixa de entrada."
              : "Digite seu email para redefinir sua senha"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Enviamos um link de redefinição de senha para <strong>{email}</strong>.
                Verifique sua caixa de entrada e spam.
              </p>
              <Link href="/login">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="size-4" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  autoComplete="email"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <LoaderCircle className="size-4 animate-spin" />}
                <Mail className="size-4" />
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </Button>
              <Link href="/login" className="text-sm text-center text-muted-foreground hover:text-foreground">
                Voltar ao login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
