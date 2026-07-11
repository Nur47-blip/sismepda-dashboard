import { ListChecks, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ClassRecord } from "@/lib/dashboard-data"

export function ClassProgress({ records }: { records: ClassRecord[] }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="size-4 text-primary" />
          Progress Input per Kelas
        </CardTitle>
        <CardDescription>Persentase siswa yang sudah tercatat kehadirannya</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3.5">
          {records.map((c) => {
            const recorded = c.submitted
              ? c.hadir + c.sakit + c.izin + c.alfa + c.dispensasi
              : 0
            const pct = Math.round((recorded / c.totalStudents) * 100)
            const barColor = c.submitted ? "var(--chart-1)" : "var(--chart-5)"
            return (
              <li key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {c.submitted ? (
                      <span className="tabular-nums">{c.submittedAt} WIB</span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium text-[var(--chart-5)]">
                        <Clock className="size-3" />
                        Menunggu
                      </span>
                    )}
                    <span className="font-semibold text-foreground tabular-nums">{pct}%</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
