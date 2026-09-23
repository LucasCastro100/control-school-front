import { CARDS_SCRIPT, PDF_DIR, listPdf, readState, runScript } from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  const state = readState()
  if (state.status === "running") {
    return Response.json(
      { ok: false, error: "Aguarde a automação terminar antes de gerar os cards." },
      { status: 409 }
    )
  }

  const { proc, output } = runScript(CARDS_SCRIPT, [])

  const code = await new Promise<number | null>((resolve) => {
    proc.on("close", (c) => resolve(c))
    proc.on("error", () => resolve(null))
  })

  if (code === null) {
    return Response.json(
      { ok: false, error: "Falha ao executar o gerador de cards." },
      { status: 500 }
    )
  }
  if (code !== 0) {
    return Response.json(
      { ok: false, error: output().slice(-800) || "Falha ao gerar os cards." },
      { status: 500 }
    )
  }

  return Response.json({ ok: true, cardFiles: listPdf(PDF_DIR) })
}

export async function GET() {
  return Response.json({ ok: true, cardFiles: listPdf(PDF_DIR) })
}