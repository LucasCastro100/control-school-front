import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { spawn } from "node:child_process"
import { FRONT_DIR, RUN_DIR, ensureRunDir } from "./register-data"

export const MONITOR_LOG_FILE = join(RUN_DIR, "monitoramento-progress.log")
export const MONITOR_STATE_FILE = join(RUN_DIR, "monitoramento-state.json")
export const MONITOR_ITENS_FILE = join(RUN_DIR, "monitoramentos.json")
export const MONITOR_SCRIPT = join(FRONT_DIR, "automation", "register_monitoramento.mjs")

export interface MonitorRunState {
  status: "idle" | "running" | "done" | "error"
  pid?: number
  startedAt?: number
  endCode?: number
  message?: string
}

export interface MonitorItem {
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
}

export interface MonitorCounts {
  total?: number
  ok: number
  falha: number
}

export function readMonitorState(): MonitorRunState {
  if (!existsSync(MONITOR_STATE_FILE)) return { status: "idle" }
  try {
    return JSON.parse(readFileSync(MONITOR_STATE_FILE, "utf8")) as MonitorRunState
  } catch {
    return { status: "idle" }
  }
}

export function writeMonitorState(s: MonitorRunState) {
  ensureRunDir()
  writeFileSync(MONITOR_STATE_FILE, JSON.stringify(s, null, 2))
}

export function readMonitorItens(): MonitorItem[] {
  if (!existsSync(MONITOR_ITENS_FILE)) return []
  try {
    const dados = JSON.parse(readFileSync(MONITOR_ITENS_FILE, "utf8")) as { itens?: MonitorItem[] }
    return Array.isArray(dados.itens) ? dados.itens : []
  } catch {
    return []
  }
}

export function writeMonitorItens(itens: MonitorItem[]) {
  ensureRunDir()
  writeFileSync(MONITOR_ITENS_FILE, JSON.stringify({ itens }, null, 2))
}

export function readMonitorLines(): string[] {
  if (!existsSync(MONITOR_LOG_FILE)) return []
  return readFileSync(MONITOR_LOG_FILE, "utf8").split("\n").filter(Boolean).slice(-150)
}

export function parseMonitorCounts(lines: string[]): MonitorCounts {
  const counts: MonitorCounts = { ok: 0, falha: 0 }
  for (const line of lines) {
    const total = line.match(/Total de itens:\s*(\d+)/)
    if (total) counts.total = parseInt(total[1], 10)
    if (line.startsWith("MONITORAMENTO OK")) counts.ok++
    if (line.startsWith("MONITORAMENTO FALHA")) counts.falha++
    if (line.startsWith("Arquivo não encontrado")) counts.total = 0
  }
  return counts
}

export function runMonitorScript(
  creds: { usuario: string; senha: string },
  opts: { showBrowser?: boolean } = {}
): { proc: ReturnType<typeof spawn> } {
  const child = spawn("node", [MONITOR_SCRIPT, MONITOR_ITENS_FILE], {
    cwd: FRONT_DIR,
    detached: true,
    env: {
      ...process.env,
      DIRETORIO_DADOS: RUN_DIR,
      HEADLESS: opts.showBrowser ? "false" : "true",
      MUNDOZ_USUARIO: creds.usuario,
      MUNDOZ_SENHA: creds.senha,
    },
  })
  const onData = (buf: Buffer) => {
    const text = buf.toString().replace(/\u001b\[[0-9;]*m/g, "")
    try {
      appendFileSync(MONITOR_LOG_FILE, text)
    } catch {
      // ignora erro de escrita do log
    }
  }
  child.stdout?.on("data", onData)
  child.stderr?.on("data", onData)
  return { proc: child }
}

export function stopMonitorRun(): { ok: boolean; message?: string } {
  const state = readMonitorState()
  const pid = state.pid
  if (!pid) return { ok: false, message: "Nenhuma automação em execução." }
  try {
    process.kill(-pid, "SIGTERM")
  } catch {
    try {
      process.kill(pid, "SIGTERM")
    } catch {
      return { ok: false, message: "Processo já encerrado." }
    }
  }
  writeMonitorState({ status: "idle", message: "Automação interrompida pelo usuário." })
  return { ok: true }
}