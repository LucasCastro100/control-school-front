import { NextResponse } from "next/server"
import { getSessionCookie } from "@/lib/auth/cookies"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"

export async function GET() {
  const token = await getSessionCookie()
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!res.ok) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const userData = await res.json()

  const base = {
    userId: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
  }

  let schoolId: string | undefined
  if (userData.role === "escola") {
    const schoolsRes = await fetch(`${BACKEND_URL}/api/users/${userData.id}/schools`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (schoolsRes.ok) {
      const schools = await schoolsRes.json()
      schoolId = Array.isArray(schools) && schools.length > 0 ? schools[0].id : undefined
    }
  }

  return NextResponse.json({ user: { ...base, schoolId } })
}