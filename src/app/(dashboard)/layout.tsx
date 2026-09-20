"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getSession } from "@/lib/db"
import { PageHeaderProvider, usePageHeader } from "@/lib/page-header"
import type { AuthUser } from "@/lib/types"

function Header() {
  const { left } = usePageHeader()

  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-background/70 px-4 py-2 backdrop-blur-xl">
      <SidebarTrigger />
      <div className="flex items-center gap-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:tracking-tight">{left}</div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const u = await getSession()
      if (!u) {
        router.push("/login")
      } else {
        setUser(u)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!user) return
    if (
      user.role === "escola" &&
      user.schoolId &&
      !pathname.startsWith(`/schools/${user.schoolId}`)
    ) {
      router.push(`/schools/${user.schoolId}/classes`)
    }
  }, [user, pathname, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user!} />
      <main className="relative flex-1">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 size-[32rem] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-24 size-[28rem] rounded-full bg-secondary/10 blur-[120px]" />
          <div className="absolute bottom-0 -left-24 size-[26rem] rounded-full bg-accent/10 blur-[120px]" />
        </div>
        <PageHeaderProvider>
          <div className="sticky top-0 z-30">
            <Header />
          </div>
          <div className="relative p-6">
            {children}
          </div>
        </PageHeaderProvider>
      </main>
    </SidebarProvider>
  )
}
