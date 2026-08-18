import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function AgendaSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-9 w-64" />
      </div>
      <Card className="p-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px bg-border">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-background px-2 py-1.5 text-center">
                <Skeleton className="h-3 w-8 mx-auto" />
              </div>
            ))}
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="min-h-28 bg-background p-1.5 flex flex-col gap-1">
                <Skeleton className="h-3 w-4" />
                <div className="flex flex-col gap-1 mt-1">
                  {i % 3 === 0 && <Skeleton className="h-4 w-full rounded" />}
                  {i % 5 === 0 && <Skeleton className="h-4 w-3/4 rounded" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
