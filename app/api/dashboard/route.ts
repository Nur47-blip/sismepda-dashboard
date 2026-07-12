import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import { parseDateValue } from "@/lib/date"

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const date = parseDateValue(new URL(request.url).searchParams.get("date"))
    const classWhere = user.role === "GURU" ? { homeroomUserId: user.id } : {}
    const rows = await prisma.schoolClass.findMany({
      where: classWhere,
      include: { students: { where: { active: true } }, homeroomUser: { select: { name: true } }, attendanceDays: { where: { date }, include: { attendances: { include: { student: { include: { attendances: { select: { status: true } } } } } } } } }, orderBy: { name: "asc" },
    })
    const classes = rows.map((c) => {
      const day = c.attendanceDays[0]; const count = (status: string) => day?.attendances.filter((a) => a.status === status).length ?? 0
      return { id: c.id, name: c.name, grade: c.grade, homeroom: c.homeroomUser?.name ?? "Belum ditentukan", totalStudents: c.students.length, submitted: Boolean(day), submittedAt: day ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(day.submittedAt).replace(".", ":") : null, hadir: count("HADIR"), sakit: count("SAKIT"), izin: count("IZIN"), alfa: count("ALFA"), dispensasi: count("DISPENSASI") }
    })
    const absentStudents = rows.flatMap((c) => c.attendanceDays[0]?.attendances.filter((a) => a.status !== "HADIR").map((a) => { const count = (status: string) => a.student.attendances.filter((item) => item.status === status).length; return { id: a.id, name: a.student.name, nis: a.student.nisn, className: c.name, status: a.status.toLowerCase(), note: a.note ?? "-", history: { sakit: count("SAKIT"), izin: count("IZIN"), alfa: count("ALFA"), dispensasi: count("DISPENSASI") } } }) ?? [])
    const recentDays = await prisma.attendanceDay.findMany({ where: { date, schoolClass: classWhere }, include: { schoolClass: true, submittedBy: true, attendances: { select: { status: true } } }, orderBy: { submittedAt: "desc" }, take: 7 })
    const recentActivity = recentDays.map((day) => ({ id: day.id, teacher: day.submittedBy.name, className: day.schoolClass.name, action: "menginput absensi", time: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(day.submittedAt).replace(".", ":"), type: "input" }))
    const trendDays = await prisma.attendanceDay.findMany({ where: { date: { lte: date }, schoolClass: classWhere }, select: { date: true, attendances: { select: { status: true } } }, orderBy: { date: "desc" } })
    const byDate = new Map<string, { date: Date; hadir: number; total: number }>()
    for (const day of trendDays) { const key = day.date.toISOString().slice(0, 10); const item = byDate.get(key) ?? { date: day.date, hadir: 0, total: 0 }; item.hadir += day.attendances.filter((a) => a.status === "HADIR").length; item.total += day.attendances.length; byDate.set(key, item) }
    const weeklyTrend = [...byDate.values()].slice(0, 6).reverse().map((item) => ({ day: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(item.date).replace(".", ""), rate: item.total ? Math.round(item.hadir / item.total * 100) : 0 }))
    return NextResponse.json({ classes, absentStudents, recentActivity, weeklyTrend })
  } catch { return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }) }
}
