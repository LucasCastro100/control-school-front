"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, KeyRound } from "lucide-react"
import { usePageHeader } from "@/lib/page-header"
import { getSchool } from "@/lib/db"
import type { School } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SchoolAccountsView } from "./school-accounts-view"

export default function SchoolAccountsPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [school, setSchool] = useState<School | null>(null)
  const { setHeader } = usePageHeader()

  useEffect(() => {
    getSchool(id).then((s) => setSchool(s ?? null))
  }, [id])

  useEffect(() => {
    setHeader(
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/20">
          <KeyRound className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-medium">Contas de acesso - {school?.name}</h1>
      </div>
    )
  }, [setHeader, school?.name, id])

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Link href={"/schools/" + id + "/classes"}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Turmas
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="pt-6">
          <SchoolAccountsView schoolId={id} />
        </CardContent>
      </Card>
    </>
  )
}