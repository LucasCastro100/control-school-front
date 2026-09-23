import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import {
  DATA_DIR,
  ensureDataDir,
  getDataFile,
  deleteSpreadsheet,
  listSpreadsheets,
  sanitizeSpreadsheetName,
  setActiveName,
} from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_SIZE_BYTES = 20 * 1024 * 1024

export async function GET() {
  return Response.json({ ok: true, file: getDataFile(), files: listSpreadsheets() })
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get("file")

  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "Envie um arquivo .xlsx." }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return Response.json(
      { ok: false, error: "Formato inválido. Envie um arquivo .xlsx." },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ ok: false, error: "Arquivo muito grande (máx. 20 MB)." }, { status: 413 })
  }

  const name = sanitizeSpreadsheetName(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  ensureDataDir()
  await writeFile(join(DATA_DIR, name), buffer)
  setActiveName(name)

  return Response.json({ ok: true, file: getDataFile(), files: listSpreadsheets() })
}

export async function DELETE() {
  const res = deleteSpreadsheet()
  return Response.json({ ok: res.ok, file: res.file, files: listSpreadsheets() })
}