import { readState, readLines, parseCounts, loadStudents, listPdf, PDF_DIR } from "@/lib/register-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const state = readState()
  const lines = readLines()
  const counts = parseCounts(lines)
  const students = await loadStudents()

  return Response.json({
    state,
    counts,
    lines,
    students,
    studentsTotal: students.length,
    cardFiles: listPdf(PDF_DIR),
  })
}