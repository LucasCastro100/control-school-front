import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { verifyPassword } from "@/lib/auth/crypto"
import { createToken } from "@/lib/auth/jwt"
import { setSessionCookie } from "@/lib/auth/cookies"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const validPassword = await verifyPassword(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    await setSessionCookie(token)

    return NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
