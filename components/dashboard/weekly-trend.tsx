import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { weeklyTrend } from "@/lib/dashboard-data"

export function WeeklyTrend() {
  const width = 320
  const height = 120
  const padX = 16
  const padY = 14
  const min = 85
  const max = 100
  const points = weeklyTrend.map((d, i) => {
    const x = padX + (i * (width - padX * 2)) / (weeklyTrend.length - 1)
    const y = padY + ((max - d.rate) / (max - min)) * (height - padY * 2)
    return { ...d, x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`
  const avg = Math.round(weeklyTrend.reduce((s, d) => s + d.rate, 0) / weeklyTrend.length)

  return (
    <Card className="shrink-0 border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-[var(--chart-1)]" />
              Tren Kehadiran Mingguan
            </CardTitle>
            <CardDescription>Rata-rata persentase kehadiran 6 hari terakhir</CardDescription>
          </div>
          <span className="rounded-full bg-[var(--chart-1)]/12 px-2.5 py-1 text-sm font-semibold text-[var(--chart-1)] tabular-nums">
            {avg}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-32 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Grafik tren kehadiran mingguan"
        >
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#trendFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p) => (
            <circle key={p.day} cx={p.x} cy={p.y} r="3.5" fill="var(--chart-1)" stroke="var(--card)" strokeWidth="2" />
          ))}
        </svg>
        <div className="mt-2 flex justify-between px-1 text-xs text-muted-foreground">
          {weeklyTrend.map((d) => (
            <span key={d.day}>{d.day}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
