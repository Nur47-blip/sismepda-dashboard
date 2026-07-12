import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ClassRecord } from "@/lib/dashboard-data"

export function ClassesNotInput({ records }: { records: ClassRecord[] }) {
  const pending = records.filter((c) => !c.submitted)

  return (
    <Card className="flex h-full min-h-0 flex-col border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-[var(--chart-5)]" />
              Kelas Belum Input
            </CardTitle>
            <CardDescription>Kelas yang belum mengisi absensi pada tanggal dipilih</CardDescription>
          </div>
          {pending.length > 0 && (
            <span className="rounded-full bg-[var(--chart-5)]/12 px-2.5 py-1 text-sm font-semibold text-[var(--chart-5)] tabular-nums">
              {pending.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-[var(--chart-1)]/12 text-[var(--chart-1)]">
              <CheckCircle2 className="size-6" />
            </span>
            <p className="text-sm font-medium text-foreground">Semua kelas sudah input</p>
            <p className="text-xs text-muted-foreground">Tidak ada yang perlu ditindaklanjuti.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {pending.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--chart-5)]/20 bg-[var(--chart-5)]/5 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Wali: {c.homeroom} · {c.totalStudents} siswa
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
