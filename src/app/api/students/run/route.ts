import { writeFileSync } from "node:fs"
import {
  LOG_FILE,
  RUN_SCRIPT,
  ensureRunDir,
  readState,
  writeState,
  runScript,
} from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const state = readState()
  if (state.status === "running") {
    return Response.json(
      { ok: false, error: "Já existe uma automação em andamento." },
      { status: 409 }
    )
  }

  const body = (await req.json().catch(() => ({}))) as {
    browsers?: unknown
    showBrowser?: unknown
  }
  const browsers = Math.max(1, parseInt(String(body.browsers ?? "1"), 10) || 1)
  const showBrowser = body.showBrowser === true

  ensureRunDir()
  writeFileSync(LOG_FILE, "")
  writeState({ status: "running", startedAt: Date.now() })

  const { proc } = runScript(RUN_SCRIPT, [String(browsers)], { showBrowser })

  writeState({ status: "running", pid: proc.pid, startedAt: Date.now() })

  proc.on("error", (e) => {
    writeState({ status: "error", message: e.message })
  })
  proc.on("close", (code) => {
    const current = readState()
    writeState({ ...current, status: code === 0 ? "done" : "error", endCode: code ?? undefined })
  })

  return Response.json({ ok: true, pid: proc.pid })
}