import { NextResponse } from "next/server"
import { readMonitorLines } from "@/lib/monitor-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ lines: readMonitorLines() })
}