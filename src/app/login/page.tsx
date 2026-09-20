"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GraduationCap, LogIn, Eye, EyeOff, Loader2 } from "lucide-react"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/db"
import FloatingLines from "@/components/FloatingLines"
import StarBorder from "@/components/StarBorder"

const loginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório.").email("Email inválido."),
  password: z.string().min(1, "Senha é obrigatória."),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  const floatingWaves = useMemo(
    () => ({
      enabledWaves: ["top", "bottom", "middle"] as ("top" | "bottom" | "middle")[],
      linesGradient: ["#a78bfa", "#22d3ee", "#f0abfc"],
    }),
    []
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setServerError("")

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormData
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)

    const { user, error: loginError } = await login(result.data.email.trim(), result.data.password)
    if (user) {
      if (user.role === "escola") {
        router.push(user.schoolId ? `/schools/${user.schoolId}/classes` : "/login")
      } else {
        router.push("/schools")
      }
    } else {
      if (loginError === "email_not_confirmed") {
        setServerError("Email ainda não confirmado. Verifique sua caixa de entrada.")
      } else {
        setServerError("Email ou senha inválidos.")
      }
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0" aria-hidden="true">
        <FloatingLines
          enabledWaves={floatingWaves.enabledWaves}
          linesGradient={floatingWaves.linesGradient}
          lineCount={8}
          lineDistance={8}
          bendRadius={8}
          bendStrength={-2}
          interactive
          parallax
          animationSpeed={1}
          backgroundColor="#0a0a16"
          lightMode={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background/90" />
        <div className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="pointer-events-none relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-sm rounded-3xl border border-white/10 bg-background/50 p-8 shadow-2xl shadow-primary/10 backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="mb-3 relative">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl" />
              <div className="relative flex size-16 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-primary to-secondary shadow-lg">
                <GraduationCap className="size-8 text-white" />
              </div>
            </div>
            <h1 className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-3xl font-extrabold tracking-wide text-transparent">
              IdeiasDev
            </h1>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-200/90">Controle de escolas</p>
            <p className="text-sm text-muted-foreground">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="font-medium text-foreground/90">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                autoComplete="email"
                className="bg-white/5 placeholder:text-foreground/55"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="font-medium text-foreground/90">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  className="bg-white/5 pr-10 placeholder:text-foreground/55"
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
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              <Link
                href="/forgot-password"
                className="text-right text-xs font-medium text-violet-200/90 transition-colors hover:text-violet-100"
              >
                Esqueci a senha
              </Link>
            </div>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <StarBorder
              as="button"
              type="submit"
              className="w-full"
              color="#a78bfa"
              speed="5s"
              thickness={1.5}
              backgroundColor="rgba(10, 10, 28, 0.55)"
              textColor="#ffffff"
              borderColor="rgba(255, 255, 255, 0.15)"
              disabled={loading}
              style={{ width: "100%" }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                {loading ? "Entrando..." : "Entrar"}
              </span>
            </StarBorder>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ambiente seguro · Sessão protegida
          </p>
        </div>
      </div>
    </div>
  )
}