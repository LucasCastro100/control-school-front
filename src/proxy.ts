import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value

  const publicPages = ["/login", "/forgot-password", "/reset-password"]
  const isAuthPage = publicPages.includes(request.nextUrl.pathname)
  const isProtectedRoute = !isAuthPage && request.nextUrl.pathname !== "/"
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")

  if (!token && isProtectedRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (token && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/schools"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}