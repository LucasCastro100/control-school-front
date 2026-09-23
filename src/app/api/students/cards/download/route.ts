import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { basename, isAbsolute, join } from "node:path"
import { PDF_DIR } from "@/lib/register-data"
import { PDFDocument } from "pdf-lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIME_PDF = "application/pdf"

export async function POST(req: Request) {
  let body: { files?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 })
  }
  const files =
    Array.isArray(body.files) && body.files.length > 0
      ? body.files.filter((f) => typeof f === "string" && f.toLowerCase().endsWith(".pdf"))
      : []
  if (files.length === 0) {
    return Response.json({ error: "Selecione ao menos um card." }, { status: 400 })
  }

  const merged = await PDFDocument.create()
  for (const name of files) {
    const safe = basename(String(name))
    if (isAbsolute(safe)) continue
    const abs = join(PDF_DIR, safe)
    if (!existsSync(abs)) continue
    const buf = await readFile(abs)
    const src = await PDFDocument.load(buf)
    const pages = await merged.copyPages(src, src.getPageIndices())
    for (const p of pages) merged.addPage(p)
  }

  if (merged.getPageCount() === 0) {
    return Response.json({ error: "Nenhum card válido encontrado." }, { status: 404 })
  }

  const bytes = await merged.save()
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": MIME_PDF,
      "Content-Disposition": `attachment; filename="cards-selecionados.pdf"`,
    },
  })
}