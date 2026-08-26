import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const token = request.cookies.get("session_token")?.value
  const user = token ? await verifyToken(token) : null

  const publicPages = ["/login", "/forgot-password", "/reset-password"]
  const isAuthPage = publicPages.includes(request.nextUrl.pathname)
  const isProtectedRoute = !isAuthPage && request.nextUrl.pathname !== "/"
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")

  if (!user && isProtectedRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/schools"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
