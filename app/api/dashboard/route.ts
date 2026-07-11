import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await requireUser()
    const date = new Date(); date.setHours(0,0,0,0)
    const rows = await prisma.schoolClass.findMany({
      where: user.role === "GURU" ? { homeroomUserId: user.id } : {},
      include: { students: { where: { active: true } }, homeroomUser: { select: { name: true } }, attendanceDays: { where: { date }, include: { attendances: { include: { student: true } } } } }, orderBy: { name: "asc" },
    })
    const classes = rows.map((c) => {
      const day = c.attendanceDays[0]; const count = (status: string) => day?.attendances.filter((a) => a.status === status).length ?? 0
      return { id: c.id, name: c.name, grade: c.grade, homeroom: c.homeroomUser?.name ?? "Belum ditentukan", totalStudents: c.students.length, submitted: Boolean(day), submittedAt: day ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(day.submittedAt).replace(".", ":") : null, hadir: count("HADIR"), sakit: count("SAKIT"), izin: count("IZIN"), alfa: count("ALFA"), dispensasi: count("DISPENSASI") }
    })
    const absentStudents = rows.flatMap((c) => c.attendanceDays[0]?.attendances.filter((a) => a.status !== "HADIR").map((a) => ({ id: a.id, name: a.student.name, nis: a.student.nisn, className: c.name, status: a.status.toLowerCase(), note: a.note ?? "-", history: [] })) ?? [])
    return NextResponse.json({ classes, absentStudents, recentActivity: [] })
  } catch { return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }) }
}
