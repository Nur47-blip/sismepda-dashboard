"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import {
  InputCompletionCard,
  AttendanceCard,
  ClassRecapCard,
} from "@/components/dashboard/charts-section"
import { WeeklyTrend } from "@/components/dashboard/weekly-trend"
import type { WeeklyTrendPoint } from "@/components/dashboard/weekly-trend"
import { ClassesNotInput } from "@/components/dashboard/classes-not-input"
import { AbsentStudentsTable } from "@/components/dashboard/absent-students-table"
import { ClassProgress } from "@/components/dashboard/class-progress"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { PageContainer } from "@/components/layout/page-container"
import {
  computeSummary,
  type ClassRecord,
  type AbsentStudent,
  type ActivityItem,
} from "@/lib/dashboard-data"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedClass, setSelectedClass] = useState("all")
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendPoint[]>([])
  useEffect(() => { fetch("/api/dashboard").then((response) => { if (!response.ok) throw new Error(); return response.json() }).then((data) => { setClasses(data.classes); setAbsentStudents(data.absentStudents); setRecentActivity(data.recentActivity); setWeeklyTrend(data.weeklyTrend); setLoading(false) }).catch(() => { setError(true); setLoading(false) }) }, [])

  const records = useMemo(
    () => (selectedClass === "all" ? classes : classes.filter((c) => c.id === selectedClass)),
    [selectedClass],
  )
  const summary = useMemo(() => computeSummary(records), [records])

  const filteredAbsent = useMemo(() => {
    if (selectedClass === "all") return absentStudents
    const name = classes.find((c) => c.id === selectedClass)?.name
    return absentStudents.filter((s) => s.className === name)
  }, [selectedClass])

  return (
    <PageContainer>
      <DashboardHeader selectedClass={selectedClass} onClassChange={setSelectedClass} classes={classes} />

          {error ? (
            <ErrorState />
          ) : loading ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-6">
              <SummaryCards
                totalClasses={summary.totalClasses}
                submittedCount={summary.submittedCount}
                notSubmittedCount={summary.notSubmittedCount}
                attendanceRate={summary.attendanceRate}
                totalStudentsAll={summary.totalStudentsAll}
              />

              <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
                <div className="flex flex-col gap-4 xl:col-span-2">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputCompletionCard summary={summary} />
                    <AttendanceCard summary={summary} />
                  </div>
                  <ClassProgress records={records} />
                </div>
                <div className="flex flex-col gap-4">
                  <ClassRecapCard records={records} />
                  <WeeklyTrend data={weeklyTrend} />
                  <ClassesNotInput records={records} />
                </div>
              </div>

              <AbsentStudentsTable students={filteredAbsent} />

              <RecentActivity items={recentActivity} />
            </div>
          )}
    </PageContainer>
  )
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/12 text-destructive">
        <AlertCircle className="size-7" />
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Gagal memuat data</h2>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          Terjadi kesalahan saat mengambil data absensi. Periksa koneksi Anda lalu coba lagi.
        </p>
      </div>
      <Button variant="outline" className="gap-2 bg-card">
        <RefreshCw className="size-4" />
        Muat Ulang
      </Button>
    </div>
  )
}
