import { stopRun } from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  const res = stopRun()
  if (!res.ok) {
    return Response.json({ ok: false, error: res.message }, { status: 400 })
  }
  return Response.json({ ok: true })
}