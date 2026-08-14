"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, LogIn, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/db"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.")
      return
    }

    setLoading(true)

    await new Promise((r) => setTimeout(r, 300))

    const user = login(email.trim(), password)
    if (user) {
      if (user.role === "orientador") {
        router.push("/agenda")
      } else if (user.role === "escola") {
        router.push(user.schoolId ? `/schools/${user.schoolId}/classes` : "/login")
      } else {
        router.push("/schools")
      }
    } else {
      setError("Email ou senha inválidos.")
      setLoading(false)
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
          <CardTitle className="text-xl">Control Schools</CardTitle>
          <CardDescription>Faça login para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <LogIn className="size-4" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
