import { getDataFile, listSpreadsheets, setActiveName } from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string }
  const name = (body.name || "").trim()

  if (!name) {
    return Response.json({ ok: false, error: "Informe o nome da planilha." }, { status: 400 })
  }

  if (!setActiveName(name)) {
    return Response.json({ ok: false, error: "Planilha não encontrada entre as salvas." }, { status: 400 })
  }

  return Response.json({ ok: true, file: getDataFile(), files: listSpreadsheets() })
}