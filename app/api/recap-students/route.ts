import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await requireUser(); const today = new Date(); today.setHours(0,0,0,0)
    const students = await prisma.student.findMany({ where: { active: true, ...(user.role === "GURU" ? { schoolClass: { homeroomUserId: user.id } } : {}) }, include: { schoolClass: true, attendances: { include: { attendanceDay: true } } }, orderBy: { name: "asc" } })
    return NextResponse.json(students.map((s) => { const count = (status: string) => s.attendances.filter((a) => a.status === status).length; const todayRecord = s.attendances.find((a) => a.attendanceDay.date.getTime() === today.getTime()); return { id: s.id, name: s.name, className: s.schoolClass.name, grade: s.schoolClass.grade, hadir: count("HADIR"), sakit: count("SAKIT"), izin: count("IZIN"), dispensasi: count("DISPENSASI"), alfa: count("ALFA"), todayStatus: (todayRecord?.status ?? "HADIR").toLowerCase() } }))
  } catch { return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }) }
}
