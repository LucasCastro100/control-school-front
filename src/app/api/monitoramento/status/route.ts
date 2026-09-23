import { NextResponse } from "next/server"
import { parseMonitorCounts, readMonitorLines, readMonitorState } from "@/lib/monitor-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const state = readMonitorState()
  const lines = readMonitorLines()
  const counts = parseMonitorCounts(lines)
  return NextResponse.json({ state, counts, log: lines })
}