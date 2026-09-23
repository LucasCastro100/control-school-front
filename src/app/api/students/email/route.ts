import { setDefaultEmail } from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string }
  const email = (body.email || "").trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: "Informe um email válido." }, { status: 400 })
  }

  const res = await setDefaultEmail(email)
  if (!res.ok) {
    return Response.json({ ok: false, error: "Nenhuma planilha importada para preencher." }, { status: 400 })
  }

  return Response.json({ ok: true, count: res.count })
}