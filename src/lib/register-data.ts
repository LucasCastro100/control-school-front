import { spawn } from "node:child_process"
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { join, resolve } from "node:path"
import ExcelJS from "exceljs"

export const FRONT_DIR = process.cwd()
export const DATA_DIR = resolve(FRONT_DIR, ".data")
export const FILE_XLSX = "dados.xlsx"
export const ACTIVE_FILE = join(DATA_DIR, ".active")
export const RUN_DIR = join(DATA_DIR, ".run")
export const LOG_FILE = join(RUN_DIR, "progress.log")
export const STATE_FILE = join(RUN_DIR, "state.json")
export const PDF_DIR = join(DATA_DIR, "pdf")
export const AUTOMATION_DIR = resolve(FRONT_DIR, "automation")
export const RUN_SCRIPT = join(AUTOMATION_DIR, "register_students.mjs")
export const CARDS_SCRIPT = join(AUTOMATION_DIR, "generate_login_cards.mjs")

export interface DataFileInfo {
  name: string
  size: number
  modifiedAt: string
}

export type RunStatus = "idle" | "running" | "done" | "error"

export interface RunState {
  status: RunStatus
  pid?: number
  startedAt?: number
  endCode?: number
  message?: string
}

export interface Student {
  NOME: string
  RA: string
  TURMA: string
  EMAIL: string
  REGISTRADO: string
  INSERIDO: string
}

export interface Counts {
  total?: number
  browsers?: number
  cadastroOk: number
  cadastroFalha: number
  inseridoOk: number
  inseridoFalha: number
}

export function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true })
}

export function ensureRunDir() {
  mkdirSync(RUN_DIR, { recursive: true })
}

// Normaliza o nome do arquivo de upload (mantém o nome original p/ identificar a escola)
export function sanitizeSpreadsheetName(original: string): string {
  const base = original.split(/[\\/]/).pop() || ""
  const clean = base
    .replace(/[:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
  const withExt = clean.toLowerCase().endsWith(".xlsx") ? clean : `${clean}.xlsx`
  return withExt || FILE_XLSX
}

export function listSpreadsheets(): DataFileInfo[] {
  if (!existsSync(DATA_DIR)) return []
  return readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".xlsx"))
    .map((f) => {
      const st = statSync(join(DATA_DIR, f))
      return { name: f, size: st.size, modifiedAt: st.mtime.toISOString() }
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
}

export function getActiveName(): string {
  try {
    const name = sanitizeSpreadsheetName(readFileSync(ACTIVE_FILE, "utf8").trim())
    if (existsSync(join(DATA_DIR, name))) return name
  } catch {
    // sem .active → cai no fallback abaixo
  }
  const files = listSpreadsheets()
  if (files.length > 0) return files[0].name
  return existsSync(join(DATA_DIR, FILE_XLSX)) ? FILE_XLSX : ""
}

export function setActiveName(name: string): boolean {
  const clean = sanitizeSpreadsheetName(name)
  if (!existsSync(join(DATA_DIR, clean))) return false
  ensureDataDir()
  writeFileSync(ACTIVE_FILE, clean)
  return true
}

export function activeXlsxPath(): string | null {
  const name = getActiveName()
  if (!name) return null
  return join(DATA_DIR, name)
}

// Salva uma cópia nomeada da planilha ativa (com os resultados gravados)
export async function saveSnapshot(requestedName: string): Promise<DataFileInfo | null> {
  const source = activeXlsxPath()
  if (!source || !existsSync(source)) return null
  const clean = sanitizeSpreadsheetName(requestedName)
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.readFile(source)
  } catch {
    return null
  }
  const target = join(DATA_DIR, clean)
  await wb.xlsx.writeFile(target)
  setActiveName(clean)
  return {
    name: clean,
    size: statSync(target).size,
    modifiedAt: new Date().toISOString(),
  }
}

export function getDataFile(): DataFileInfo | null {
  const path = activeXlsxPath()
  if (!path || !existsSync(path)) return null
  const st = statSync(path)
  return {
    name: path.split(/[\\/]/).pop() || FILE_XLSX,
    size: st.size,
    modifiedAt: st.mtime.toISOString(),
  }
}

export function deleteSpreadsheet(name?: string): { ok: boolean; file: DataFileInfo | null } {
  const fileName = name ? sanitizeSpreadsheetName(name) : getActiveName()
  if (!fileName) return { ok: false, file: null }
  const path = join(DATA_DIR, fileName)
  if (existsSync(path)) {
    try {
      unlinkSync(path)
    } catch {
      return { ok: false, file: null }
    }
  }
  if (getActiveName() === fileName) {
    try {
      unlinkSync(ACTIVE_FILE)
    } catch {
      // sem arquivo ativo, tudo bem
    }
  }
  return { ok: true, file: getDataFile() }
}

export function readState(): RunState {
  if (!existsSync(STATE_FILE)) return { status: "idle" }
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8")) as RunState
  } catch {
    return { status: "idle" }
  }
}

export function writeState(s: RunState) {
  ensureRunDir()
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

export function readLines(): string[] {
  if (!existsSync(LOG_FILE)) return []
  return readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean).slice(-150)
}

export function listPdf(dir = PDF_DIR): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort()
}

function cellText(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "object" && v && typeof (v as { text?: unknown }).text === "string") {
    return String((v as { text: string }).text).trim()
  }
  return String(v).trim()
}

function raText(v: unknown): string {
  let s = cellText(v)
  if (s.endsWith(".0")) s = s.slice(0, -2)
  return s
}

export async function loadStudents(): Promise<Student[]> {
  const path = activeXlsxPath()
  if (!path) return []
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.readFile(path)
  } catch {
    return []
  }
  const ws = wb.worksheets[0]
  const cols: Record<string, number> = {}
  ws.getRow(1).eachCell((cell, colNumber) => {
    const name = cellText(cell.value)
    if (name) cols[name] = colNumber
  })
  const out: Student[] = []
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const s = {
      NOME: cellText(row.getCell(cols.NOME || 1).value),
      RA: raText(row.getCell(cols.RA || 2).value),
      TURMA: cellText(row.getCell(cols.TURMA || 3).value),
      EMAIL: cols.EMAIL ? cellText(row.getCell(cols.EMAIL).value) : "",
      REGISTRADO: cols.REGISTRADO ? cellText(row.getCell(cols.REGISTRADO).value) : "",
      INSERIDO: cols.INSERIDO ? cellText(row.getCell(cols.INSERIDO).value) : "",
    }
    if (s.NOME || s.RA) out.push(s)
  }
  return out
}

// Preenche o mesmo email em todos os alunos sem email da planilha.
// Se a coluna EMAIL não existir no cabeçalho, ela é adicionada.
export async function setDefaultEmail(email: string): Promise<{ ok: boolean; count: number }> {
  const path = activeXlsxPath()
  if (!path) return { ok: false, count: 0 }
  const wb = new ExcelJS.Workbook()
  let ws: ExcelJS.Worksheet | null = null
  try {
    await wb.xlsx.readFile(path)
    ws = wb.worksheets[0]
  } catch {
    return { ok: false, count: 0 }
  }
  if (!ws) return { ok: false, count: 0 }

  let emailCol = 0
  let nomeCol = 0
  let raCol = 0
  ws.getRow(1).eachCell((cell, col) => {
    const name = cellText(cell.value).toUpperCase()
    if (!emailCol && name === "EMAIL") emailCol = col
    if (!nomeCol && name === "NOME") nomeCol = col
    if (!raCol && name === "RA") raCol = col
  })
  if (!emailCol) {
    emailCol = ws.columnCount + 1
    ws.getRow(1).getCell(emailCol).value = "EMAIL"
  }

  let count = 0
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    // Só preenche em linhas que realmente representam alunos
    const temDado =
      (nomeCol > 0 && cellText(row.getCell(nomeCol).value)) || (raCol > 0 && cellText(row.getCell(raCol).value))
    if (!temDado) continue
    if (!cellText(row.getCell(emailCol).value)) {
      row.getCell(emailCol).value = email
      count++
    }
  }
  await wb.xlsx.writeFile(path)
  return { ok: true, count }
}

export function parseCounts(lines: string[]): Counts {
  const counts: Counts = {
    cadastroOk: 0,
    cadastroFalha: 0,
    inseridoOk: 0,
    inseridoFalha: 0,
  }
  for (const line of lines) {
    const total = line.match(/Total pendentes:\s*(\d+)/)
    if (total) counts.total = parseInt(total[1], 10)
    const browsers = line.match(/Navegadores:\s*(\d+)/)
    if (browsers) counts.browsers = parseInt(browsers[1], 10)
    if (line.startsWith("CADASTRO OK")) counts.cadastroOk++
    if (line.startsWith("CADASTRO FALHA")) counts.cadastroFalha++
    if (line.startsWith("INSERIDO OK")) counts.inseridoOk++
    if (line.startsWith("INSERIDO FALHA")) counts.inseridoFalha++
    if (line.startsWith("Arquivo não encontrado")) counts.total = 0
  }
  return counts
}

export function runScript(
  script: string,
  args: string[],
  opts: { showBrowser?: boolean } = {}
): { proc: ReturnType<typeof spawn>; output: () => string } {
  let out = ""
  const child = spawn("node", [script, ...args], {
    cwd: FRONT_DIR,
    detached: true,
    env: {
      ...process.env,
      DIRETORIO_DADOS: DATA_DIR,
      FILE_XLSX: getActiveName() || FILE_XLSX,
      HEADLESS: opts.showBrowser ? "false" : "true",
    },
  })
  const onData = (buf: Buffer) => {
    const text = buf.toString().replace(/\u001b\[[0-9;]*m/g, "")
    out += text
    try {
      appendFileSync(LOG_FILE, text)
    } catch {
      // ignora erro de escrita do log
    }
  }
  child.stdout?.on("data", onData)
  child.stderr?.on("data", onData)
  return { proc: child, output: () => out }
}

// Interrompe a automação em execução (mata o processo e os navegadores do grupo)
export function stopRun(): { ok: boolean; message?: string } {
  const state = readState()
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
  writeState({ status: "idle", message: "Automação interrompida pelo usuário." })
  return { ok: true }
}