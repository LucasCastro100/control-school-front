import { NextResponse } from "next/server"
import { deleteSessionCookie } from "@/lib/auth/cookies"

export async function POST() {
  await deleteSessionCookie()
  return NextResponse.json({ success: true })
}
