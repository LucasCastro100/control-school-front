import { NextResponse } from "next/server"
import { getSessionCookie } from "@/lib/auth/cookies"
import { verifyToken } from "@/lib/auth/jwt"

export async function GET() {
  const token = await getSessionCookie()
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    },
  })
}
