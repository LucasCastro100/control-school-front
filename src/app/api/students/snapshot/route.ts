import { listSpreadsheets, saveSnapshot } from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string }
  const name = (body.name || "").trim()

  if (!name) {
    return Response.json({ ok: false, error: "Dê um nome para a planilha." }, { status: 400 })
  }

  const file = await saveSnapshot(name)
  if (!file) {
    return Response.json({ ok: false, error: "Nenhuma planilha ativa para salvar." }, { status: 400 })
  }

  return Response.json({ ok: true, file, files: listSpreadsheets() })
}