import { NextResponse } from "next/server"
import { writeFile } from "node:fs/promises"
import path from "node:path"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const filePath = path.join(process.cwd(), "src/data/seed.json")
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar seed.json:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
