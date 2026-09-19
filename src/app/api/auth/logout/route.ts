import { NextResponse } from "next/server"
import { getSessionCookie, deleteSessionCookie } from "@/lib/auth/cookies"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"

export async function POST() {
  const token = await getSessionCookie()

  if (token) {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => {})
  }

  await deleteSessionCookie()

  return NextResponse.json({ success: true })
}