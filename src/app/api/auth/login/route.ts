import { NextResponse } from "next/server"
import { setSessionCookie } from "@/lib/auth/cookies"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"

function mapUser(user: {
  id: string
  email: string
  name: string
  role: string
  schoolId?: string
}) {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })

    const data = await res.json().catch(() => null)

    if (!res.ok || !data?.token) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    await setSessionCookie(data.token)

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
    }

    let schoolId: string | undefined
    if (user.role === "escola") {
      const schoolsRes = await fetch(`${BACKEND_URL}/api/users/${user.id}/schools`, {
        headers: { Authorization: `Bearer ${data.token}` },
        cache: "no-store",
      })
      if (schoolsRes.ok) {
        const schools = await schoolsRes.json()
        schoolId = Array.isArray(schools) && schools.length > 0 ? schools[0].id : undefined
      }
    }

    return NextResponse.json({ user: mapUser({ ...user, schoolId }) })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}