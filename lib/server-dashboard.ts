import { requireUser } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import type { ClassRecord } from "@/lib/dashboard-data"

export async function getTodayClassRecords(): Promise<ClassRecord[]> {
  const user = await requireUser()
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  const rows = await prisma.schoolClass.findMany({
    where: user.role === "GURU" ? { homeroomUserId: user.id } : {},
    include: { students: { where: { active: true } }, homeroomUser: true, attendanceDays: { where: { date }, include: { attendances: true } } },
    orderBy: { name: "asc" },
  })
  return rows.map((c) => {
    const day = c.attendanceDays[0]
    const count = (status: string) => day?.attendances.filter((a) => a.status === status).length ?? 0
    return {
      id: c.id, name: c.name, grade: c.grade as ClassRecord["grade"],
      homeroom: c.homeroomUser?.name ?? "Belum ditentukan", totalStudents: c.students.length,
      submitted: Boolean(day), submittedAt: day ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(day.submittedAt).replace(".", ":") : null,
      hadir: count("HADIR"), sakit: count("SAKIT"), izin: count("IZIN"), alfa: count("ALFA"), dispensasi: count("DISPENSASI"),
    }
  })
}
