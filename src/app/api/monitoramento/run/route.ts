import { writeFileSync } from "node:fs"
import { getSessionCookie } from "@/lib/auth/cookies"
import {
  MONITOR_LOG_FILE,
  readMonitorItens,
  readMonitorState,
  runMonitorScript,
  writeMonitorItens,
  writeMonitorState,
} from "@/lib/monitor-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"

interface BodyItem {
  id?: unknown
  data?: unknown
  startTime?: unknown
  endTime?: unknown
  activity?: unknown
  escola?: unknown
  ano?: unknown
  tipo?: unknown
  confirmadoPor?: unknown
  registrarMundoz?: unknown
}

export async function POST(req: Request) {
  const token = await getSessionCookie()
  if (!token) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
  }

  const state = readMonitorState()
  if (state.status === "running") {
    return Response.json({ ok: false, error: "Já existe uma automação de monitoramento em andamento." }, { status: 409 })
  }

  const body = (await req.json().catch(() => ({}))) as { items?: unknown; showBrowser?: unknown }
  const showBrowser = body.showBrowser === true

  const auth = { Authorization: `Bearer ${token}` }

  const meRes = await fetch(`${BACKEND_URL}/api/auth/session`, { headers: auth, cache: "no-store" })
  if (!meRes.ok) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
  }
  const me = (await meRes.json()) as { id: string; name: string; role: string; email: string }

  if (me.role !== "orientador" && me.role !== "admin") {
    return Response.json({ ok: false, error: "Apenas orientador ou admin pode registrar monitoramentos." }, { status: 403 })
  }

  const credsRes = await fetch(`${BACKEND_URL}/api/users/${me.id}/mundoz`, { headers: auth, cache: "no-store" })
  if (credsRes.status === 403) {
    return Response.json({ ok: false, error: "Não autorizado a usar esta conta." }, { status: 403 })
  }
  if (!credsRes.ok) {
    return Response.json({ ok: false, error: "Falha ao buscar credenciais do MundoZ." }, { status: 500 })
  }
  const creds = (await credsRes.json()) as { mundoz_user?: string; mundoz_password?: string }
  if (!creds.mundoz_user || !creds.mundoz_password) {
    return Response.json(
      { ok: false, error: "Cadastre suas credenciais do MundoZ no Perfil antes de registrar monitoramentos." },
      { status: 400 }
    )
  }

  const schoolsRes = await fetch(`${BACKEND_URL}/api/users/${me.id}/schools`, { headers: auth, cache: "no-store" })
  const schools = schoolsRes.ok ? ((await schoolsRes.json()) as { name?: string }[]) : []
  const escola = Array.isArray(schools) && schools.length > 0 ? schools[0].name ?? "" : ""
  const ano = String(new Date().getFullYear())

  const term = String
  const reported = Array.isArray(body.items) ? (body.items as BodyItem[]) : []
  const prevItens = readMonitorItens()
  const doneIds = new Set(prevItens.filter((i) => i.status === "OK").map((i) => i.id))

  const novos: {
    id: string
    escola: string
    ano: string
    tipo: string
    confirmadoPor: string
    data: string
    inicio: string
    fim: string
    atividade: string
    status: string
  }[] = []
  for (const it of reported) {
    const id = String(it.id ?? "")
    if (!id || doneIds.has(id)) continue
    if (!(it.registrarMundoz === true || it.registrarMundoz === "true")) continue
    novos.push({
      id,
      escola: term(it.escola ?? "") || escola,
      ano: term(it.ano ?? "") || ano,
      tipo: term(it.tipo ?? "") || "Presencial",
      confirmadoPor: term(it.confirmadoPor ?? "") || me.name,
      data: String(it.data ?? ""),
      inicio: String(it.startTime ?? ""),
      fim: String(it.endTime ?? ""),
      atividade: String(it.activity ?? ""),
      status: "",
    })
  }

  if (novos.length === 0) {
    return Response.json({ ok: false, error: "Nenhum item novo da agenda para registrar." }, { status: 400 })
  }

  writeMonitorItens([...prevItens.filter((i) => i.status === "OK"), ...novos])
  writeFileSync(MONITOR_LOG_FILE, "")
  writeMonitorState({ status: "running", startedAt: Date.now() })

  const { proc } = runMonitorScript(
    { usuario: creds.mundoz_user, senha: creds.mundoz_password },
    { showBrowser }
  )
  writeMonitorState({ status: "running", pid: proc.pid, startedAt: Date.now() })

  proc.on("error", (e) => {
    writeMonitorState({ status: "error", message: e.message })
  })
  proc.on("close", (code) => {
    const current = readMonitorState()
    writeMonitorState({
      ...current,
      status: code === 0 ? "done" : "error",
      endCode: code ?? undefined,
    })
  })

  return Response.json({ ok: true, pid: proc.pid })
}