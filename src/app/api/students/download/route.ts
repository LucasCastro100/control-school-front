import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { DATA_DIR, PDF_DIR, sanitizeSpreadsheetName } from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const name = basename(url.searchParams.get("file") || "")
  if (!name) {
    return Response.json({ error: "Parâmetro file obrigatório." }, { status: 400 })
  }

  const isXlsx = name.toLowerCase().endsWith(".xlsx")
  let abs: string
  let contentType: string

  if (isXlsx) {
    abs = resolve(join(DATA_DIR, sanitizeSpreadsheetName(name)))
    contentType = MIME_XLSX
  } else {
    const pdfDir = resolve(PDF_DIR)
    abs = resolve(join(pdfDir, name))
    if (!abs.startsWith(pdfDir) || abs.includes("..")) {
      return Response.json({ error: "Arquivo não encontrado." }, { status: 404 })
    }
    contentType = "application/pdf"
  }

  if (!existsSync(abs) || !abs.startsWith(resolve(DATA_DIR))) {
    return Response.json({ error: "Arquivo não encontrado." }, { status: 404 })
  }

  const buf = await readFile(abs)
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${basename(abs)}"`,
    },
  })
}