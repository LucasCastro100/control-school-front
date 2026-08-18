"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getAuthUser, initStorage } from "@/lib/db"
import { PageHeaderProvider, usePageHeader } from "@/lib/page-header"
import type { AuthUser } from "@/lib/types"

function Header() {
  const { left, right } = usePageHeader()

  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-3">{left}</div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
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
    initStorage()
    const u = getAuthUser()
    if (!u) {
      router.push("/login")
    } else {
      setUser(u)
      setLoading(false)
    }
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
      <main className="flex-1">
        <PageHeaderProvider>
          <Header />
          <div className="p-6">
            {children}
          </div>
        </PageHeaderProvider>
      </main>
    </SidebarProvider>
  )
}
