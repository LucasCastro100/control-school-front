"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Download,
  FileDown,
  FileSpreadsheet,
  LoaderCircle,
  Mail,
  Play,
  RefreshCw,
  Save,
  Square,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { usePageHeader } from "@/lib/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface StudentRow {
  NOME: string
  RA: string
  TURMA: string
  EMAIL: string
  REGISTRADO: string
  INSERIDO: string
}

interface RunStateData {
  status: "idle" | "running" | "done" | "error"
  pid?: number
  startedAt?: number
  endCode?: number
  message?: string
}

interface CountsData {
  total?: number
  browsers?: number
  cadastroOk: number
  cadastroFalha: number
  inseridoOk: number
  inseridoFalha: number
}

interface StatusData {
  state: RunStateData
  counts: CountsData
  lines: string[]
  students: StudentRow[]
  studentsTotal: number
  cardFiles: string[]
}

interface DataFileInfo {
  name: string
  size: number
  modifiedAt: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR")
}

function logClass(line: string): string {
  if (/FALHA|error|Error|não encontrado/i.test(line)) return "fail"
  if (/OK|Concluído|Total pendentes|Navegadores|Gerado/i.test(line)) return "ok"
  return "dim"
}

function statusBadge(v: string) {
  if (!v) return <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">—</span>
  if (v.toUpperCase() === "OK") {
    return (
      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-bold text-green-600 dark:text-green-400">
        OK
      </span>
    )
  }
  return (
    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
      FALHA
    </span>
  )
}

function StatCard({ num, label, tone }: { num: string | number; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className={cn("text-2xl font-bold", tone)}>{num}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export default function StudentsRegisterPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [browsers, setBrowsers] = useState(1)
  const [showBrowser, setShowBrowser] = useState(false)
  const [busyCards, setBusyCards] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadedFile, setUploadedFile] = useState<DataFileInfo | null>(null)
  const [files, setFiles] = useState<DataFileInfo[]>([])
  const [emailDraft, setEmailDraft] = useState("")
  const [savingEmail, setSavingEmail] = useState(false)
  const [snapshotName, setSnapshotName] = useState("")
  const [savingSnapshot, setSavingSnapshot] = useState(false)
  const [activating, setActivating] = useState(false)
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [downloadingCards, setDownloadingCards] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { setHeader } = usePageHeader()

  const refreshStatus = useCallback(() => {
    fetch("/api/students/status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const refreshUpload = useCallback(async () => {
    try {
      const res = await fetch("/api/students/upload", { cache: "no-store" })
      const j = (await res.json()) as { file?: DataFileInfo | null; files?: DataFileInfo[] }
      setUploadedFile(j.file ?? null)
      setFiles(j.files ?? [])
    } catch {
      setUploadedFile(null)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function load() {
      await refreshStatus()
      await refreshUpload()
    }
    load()
    const id = setInterval(refreshStatus, 2000)
    return () => clearInterval(id)
  }, [refreshStatus, refreshUpload])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <FileSpreadsheet className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Cadastro de Alunos</h1>
      </div>,
      <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4 mr-2" />}
        Importar Excel
      </Button>
    )
  }, [uploading])

  const status = data?.state.status ?? "idle"
  const running = status === "running"
  const done = status === "done"
  const counts = data?.counts
  const hasSpreadsheet = !!uploadedFile || (data?.studentsTotal ?? 0) > 0
  const semEmailCount = (data?.students ?? []).filter((s) => !s.EMAIL).length

  // Contadores lidos direto dos campos REGISTRADO/INSERIDO da planilha,
  // com fallback para os números extraídos do log de execução.
  const students = data?.students ?? []
  const hasStudents = students.length > 0
  const isOkVal = (v?: string) => ((v ?? "").trim().toUpperCase() === "OK")
  const isFailVal = (v?: string) => {
    const t = (v ?? "").trim().toUpperCase()
    return t !== "" && t !== "OK"
  }
  const fromSheet = (fn: (s: StudentRow) => boolean) => students.filter(fn).length
  const statsTotal = hasStudents ? students.length : counts?.total ?? data?.studentsTotal ?? "—"
  const statsCadOk = hasStudents ? fromSheet((s) => isOkVal(s.REGISTRADO)) : (counts?.cadastroOk ?? "—")
  const statsCadFalha = hasStudents ? fromSheet((s) => isFailVal(s.REGISTRADO)) : (counts?.cadastroFalha ?? "—")
  const statsInsOk = hasStudents ? fromSheet((s) => isOkVal(s.INSERIDO)) : (counts?.inseridoOk ?? "—")
  const statsInsFalha = hasStudents ? fromSheet((s) => isFailVal(s.INSERIDO)) : (counts?.inseridoFalha ?? "—")
  const pendentes = students.filter((s) => !isOkVal(s.INSERIDO)).length
  const statsPendentes = hasStudents
    ? pendentes
    : counts && counts.total != null
      ? Math.max(0, counts.total - (counts.inseridoOk + counts.inseridoFalha))
      : "—"

  // Tempo estimado: média de 1–2 min por aluno, dividido pelos navegadores em paralelo
  const tempoEstimadoMin =
    pendentes > 0 && browsers > 0 ? (pendentes * 1.5) / browsers : 0
  function formatMinutes(min: number): string {
    if (min <= 0) return "0 min"
    if (min < 1) return "< 1 min"
    const m = Math.round(min)
    if (m < 60) return `~${m} min`
    const h = Math.floor(m / 60)
    const rest = m % 60
    return `~${h}h${rest > 0 ? ` ${rest}min` : ""}`
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Formato inválido", { description: "Envie um arquivo .xlsx." })
      return
    }

    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await fetch("/api/students/upload", { method: "POST", body: form })
      const j = (await res.json()) as { ok?: boolean; error?: string; file?: DataFileInfo | null }
      if (!j.ok) throw new Error(j.error ?? "Falha ao importar.")
      setUploadedFile(j.file ?? null)
      toast.success("Planilha importada", { description: "Salva no diretório de dados." })
      refreshStatus()
    } catch (e) {
      toast.error("Erro ao importar", { description: e instanceof Error ? e.message : "Tente novamente." })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch("/api/students/upload", { method: "DELETE" })
      const j = (await res.json()) as { ok?: boolean; error?: string; file?: DataFileInfo | null }
      if (!j.ok) throw new Error(j.error ?? "Falha ao remover.")
      setUploadedFile(null)
      setData(null)
      toast.success("Planilha removida")
    } catch (e) {
      toast.error("Erro ao remover", { description: e instanceof Error ? e.message : "Tente novamente." })
    } finally {
      setDeleting(false)
    }
  }

  async function handleRun() {
    setErr(null)
    try {
      const res = await fetch("/api/students/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browsers, showBrowser }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(j.error || "Falha ao iniciar a automação.")
        return
      }
      refreshStatus()
    } catch {
      setErr("Falha de conexão com o servidor.")
    }
  }

  async function handleStop() {
    try {
      await fetch("/api/students/stop", { method: "POST" })
      refreshStatus()
    } catch {
      toast.error("Não foi possível parar a automação.")
    }
  }

  async function handleCards() {
    setErr(null)
    setBusyCards(true)
    try {
      const res = await fetch("/api/students/cards", { method: "POST" })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(j.error || "Falha ao gerar os cards.")
        return
      }
      refreshStatus()
    } catch {
      setErr("Falha de conexão com o servidor.")
    } finally {
      setBusyCards(false)
    }
  }

  async function handleDownloadCards(files: string[]) {
    if (files.length === 0) return
    setDownloadingCards(true)
    setErr(null)
    try {
      const res = await fetch("/api/students/cards/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setErr(j.error || "Falha ao baixar os cards.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = files.length === 1 ? files[0] : "cards-selecionados.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setErr("Falha de conexão com o servidor.")
    } finally {
      setDownloadingCards(false)
    }
  }

  function toggleCard(f: string) {
    setSelectedCards((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
  }

  function toggleAllCards() {
    const all = data?.cardFiles ?? []
    if (all.length > 0 && all.length === selectedCards.length) {
      setSelectedCards([])
    } else {
      setSelectedCards([...all])
    }
  }

  async function handleSetEmail() {
    const email = emailDraft.trim()
    if (!email) {
      toast.error("Digite o email antes de aplicar.")
      return
    }
    setSavingEmail(true)
    try {
      const res = await fetch("/api/students/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const j = (await res.json()) as { ok?: boolean; error?: string; count?: number }
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Falha ao preencher os emails.")
      toast.success("Email aplicado", { description: `Preenchidos ${j.count ?? 0} aluno(s) sem email.` })
      setEmailDraft("")
      refreshStatus()
    } catch (e) {
      toast.error("Erro ao preencher emails", { description: e instanceof Error ? e.message : "Tente novamente." })
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleActivate(name: string) {
    setActivating(true)
    try {
      const res = await fetch("/api/students/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const j = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Falha ao usar a planilha.")
      toast.success("Planilha ativa", { description: name })
      await refreshUpload()
      await refreshStatus()
    } catch (e) {
      toast.error("Erro ao trocar planilha", { description: e instanceof Error ? e.message : "Tente novamente." })
    } finally {
      setActivating(false)
    }
  }

  async function handleSnapshot() {
    const name = snapshotName.trim()
    if (!name) {
      toast.error("Dê um nome para salvar a planilha.")
      return
    }
    setSavingSnapshot(true)
    try {
      const res = await fetch("/api/students/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const j = (await res.json()) as { ok?: boolean; error?: string; file?: DataFileInfo | null }
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Falha ao salvar.")
      toast.success("Planilha salva no sistema", { description: j.file?.name })
      setSnapshotName("")
      await refreshUpload()
    } catch (e) {
      toast.error("Erro ao salvar", { description: e instanceof Error ? e.message : "Tente novamente." })
    } finally {
      setSavingSnapshot(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <span>Resumo</span>
              <span className="text-xs font-normal text-muted-foreground">
                {running ? "Automação em andamento…" : status === "done" ? "Automação concluída" : "Inativo"}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard num={statsTotal} label="Alunos na planilha" tone="text-primary" />
            <StatCard num={statsCadOk} label="Cadastrados" tone="text-green-600 dark:text-green-400" />
            <StatCard num={statsCadFalha} label="Falha cadastro" tone="text-red-600 dark:text-red-400" />
            <StatCard num={statsInsOk} label="Inseridos" tone="text-green-600 dark:text-green-400" />
            <StatCard num={statsInsFalha} label="Falha inserção" tone="text-red-600 dark:text-red-400" />
            <StatCard num={statsPendentes} label="Pendentes" tone="text-amber-500" />
          </div>
          {tempoEstimadoMin > 0 && (
            <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-sm">
              <span className="text-muted-foreground">Tempo estimado para concluir:</span>{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {formatMinutes(tempoEstimadoMin)}
              </span>
              <span className="text-xs text-muted-foreground">
                {" "}
                ({pendentes} aluno(s) pendente(s) × 1,5 min ÷ {browsers} navegador{browsers > 1 ? "es" : ""})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planilha de alunos</CardTitle>
          <CardDescription>
            O arquivo é salvo no diretório de dados do sistema e usado pela automação de cadastro.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <LoaderCircle className="size-5 animate-spin" />
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileSpreadsheet className="size-8 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSize(uploadedFile.size)} · importado em {formatDate(uploadedFile.modifiedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={`/api/students/download?file=${encodeURIComponent(uploadedFile?.name ?? "dados.xlsx")}`}>
                  <Button variant="outline" size="sm">
                    <Download className="size-4 mr-2" />
                    Baixar preenchida
                  </Button>
                </a>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading || running}>
                  <Upload className="size-4 mr-2" />
                  Substituir
                </Button>
                <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleting || running}>
                  {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <FileSpreadsheet className="size-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">Nenhuma planilha importada ainda.</p>
              <Button onClick={() => fileRef.current?.click()} disabled={uploading || running}>
                <Upload className="size-4 mr-2" />
                Importar Excel
              </Button>
            </div>
          )}

          {semEmailCount > 0 && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-4">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {semEmailCount} aluno(s) sem email
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                A planilha não possui email para esses alunos. Digite um email padrão que será aplicado a todos:
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="exemplo@escola.com"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !running && handleSetEmail()}
                  disabled={savingEmail || running}
                  className="max-w-sm"
                />
                <Button onClick={handleSetEmail} disabled={savingEmail || running}>
                  {savingEmail ? (
                    <LoaderCircle className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="size-4 mr-2" />
                  )}
                  {savingEmail ? "Aplicando…" : "Aplicar para todos"}
                </Button>
              </div>
              {running && (
                <p className="mt-2 text-xs text-amber-600/80">
                  Pare a automação para preencher o email.
                </p>
              )}
            </div>
          )}

          {uploadedFile && (
            <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  placeholder="Nome para salvar (ex.: escola_x_preenchida)"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSnapshot()}
                  disabled={savingSnapshot}
                  className="max-w-xs"
                />
                <Button variant="outline" size="sm" onClick={handleSnapshot} disabled={savingSnapshot}>
                  {savingSnapshot ? (
                    <LoaderCircle className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="size-4 mr-2" />
                  )}
                  {savingSnapshot ? "Salvando…" : "Salvar planilha no sistema"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Salva uma cópia da planilha preenchida no sistema com o nome que você der — para consultar depois.
              </p>
            </div>
          )}

          {files.length > 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Planilhas salvas no sistema:</p>
              <div className="flex flex-wrap gap-2">
                {files.map((f) => {
                  const active = f.name === uploadedFile?.name
                  return (
                    <Button
                      key={f.name}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() => !active && handleActivate(f.name)}
                      disabled={active || activating || running}
                      title={active ? "Planilha ativa" : "Usar esta planilha"}
                    >
                      <FileSpreadsheet className="size-3.5 mr-2" />
                      {f.name}
                      {active && " · ativa"}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {err && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {err}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Automação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Navegadores em paralelo</span>
              <Input
                type="number"
                min={1}
                value={browsers}
                onChange={(e) => setBrowsers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                disabled={running}
                className="w-20"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={showBrowser}
                onCheckedChange={setShowBrowser}
                disabled={running}
                aria-label="Mostrar navegador durante a automação"
              />
              Mostrar navegador durante a execução
            </label>
            <Button onClick={handleRun} disabled={running || !hasSpreadsheet}>
              {running ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4 mr-2" />}
              {running ? "Rodando…" : "Rodar cadastro"}
            </Button>
            {running && (
              <Button variant="destructive" onClick={handleStop}>
                <Square className="size-4 mr-2" />
                Parar
              </Button>
            )}
          </div>
          {running && (
            <p className="text-sm text-muted-foreground">
              Processando alunos — os navegadores abrem e cada passo é salvo na planilha.
            </p>
          )}
          {!hasSpreadsheet && (
            <p className="text-sm text-muted-foreground">Importe uma planilha .xlsx antes de rodar a automação.</p>
          )}
        </CardContent>
      </Card>

      {data && data.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-72 overflow-y-auto rounded-xl bg-[#10151d] p-4 font-mono text-xs leading-relaxed text-[#b8c4d4]">
              {data.lines.map((l, i) => (
                <div
                  key={i}
                  className={cn(
                    logClass(l) === "ok" && "text-[#4bd081]",
                    logClass(l) === "fail" && "text-[#ff7b74]",
                    logClass(l) === "dim" && "text-[#5f6b7c]"
                  )}
                >
                  {l}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {done && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">Automação concluída</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Todos os alunos pendentes foram processados. Gere agora os cartões de acesso (um PDF por turma).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleCards} disabled={busyCards}>
                {busyCards ? <LoaderCircle className="size-4 animate-spin" /> : <FileDown className="size-4 mr-2" />}
                {busyCards ? "Gerando…" : "Gerar cards de login"}
              </Button>
              <a href={`/api/students/download?file=${encodeURIComponent(uploadedFile?.name ?? "dados.xlsx")}`}>
                <Button variant="outline">
                  <FileSpreadsheet className="size-4 mr-2" />
                  Baixar planilha preenchida
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cards de acesso gerados</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.cardFiles.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={selectedCards.length > 0 && selectedCards.length === data.cardFiles.length}
                  onCheckedChange={toggleAllCards}
                  aria-label="Selecionar todos os cards"
                />
                Selecionar todos
              </div>
              <div className="flex flex-wrap gap-2">
                {data.cardFiles.map((f) => {
                  const checked = selectedCards.includes(f)
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleCard(f)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                        checked
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08]"
                      )}
                    >
                      <Checkbox checked={checked} aria-label={`Selecionar ${f}`} />
                      {f}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCards} disabled={busyCards || running}>
                  {busyCards ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
                  {busyCards ? "Gerando…" : "Regenerar cards"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadCards(selectedCards)}
                  disabled={downloadingCards || selectedCards.length === 0}
                >
                  {downloadingCards ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4 mr-2" />}
                  {downloadingCards ? "Baixando…" : `Baixar selecionadas (${selectedCards.length})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadCards(data.cardFiles)}
                  disabled={downloadingCards}
                >
                  <Download className="size-4 mr-2" />
                  Baixar todas
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum PDF gerado ainda. Rode a automação e, ao concluir, use o botão para gerar os cards.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alunos ({data?.studentsTotal ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data && data.students.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>RA</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Inserido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((s, i) => (
                    <TableRow key={`${s.RA}-${i}`}>
                      <TableCell className="font-medium">{s.NOME}</TableCell>
                      <TableCell>{s.RA}</TableCell>
                      <TableCell>{s.TURMA}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.EMAIL || <span className="text-amber-500/80">sem email</span>}
                      </TableCell>
                      <TableCell>{statusBadge(s.REGISTRADO)}</TableCell>
                      <TableCell>{statusBadge(s.INSERIDO)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {hasSpreadsheet
                ? "Planilha importada, mas sem alunos para exibir."
                : "Importe uma planilha .xlsx — a tabela aparece aqui."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}