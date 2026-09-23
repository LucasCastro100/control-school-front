import { NextResponse } from "next/server"
import { stopMonitorRun } from "@/lib/monitor-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  const result = stopMonitorRun()
  return NextResponse.json(result.ok ? { ok: true } : { ok: false, error: result.message })
}