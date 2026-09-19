import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "@/lib/auth/cookies"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const token = await getSessionCookie()

  if (!token) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 })
  }

  const readBody = request.method === "GET" || request.method === "HEAD"
  const body = readBody ? undefined : await request.text()

  const backendRes = await fetch(`${BACKEND_URL}/api/${path.join("/")}${request.nextUrl.search}`, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body,
    cache: "no-store",
  })

  const contentType = backendRes.headers.get("content-type") ?? "application/json"
  const text = await backendRes.text()

  return new NextResponse(text, {
    status: backendRes.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }