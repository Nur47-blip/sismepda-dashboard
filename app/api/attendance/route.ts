import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import { parseDateValue, startOfToday } from "@/lib/date"
import { sortClasses } from "@/lib/class-order"

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const classes = await prisma.schoolClass.findMany({
      where: user.role === "GURU" ? { homeroomUserId: user.id } : {},
      include: { students: { where: { active: true }, orderBy: { name: "asc" } }, homeroomUser: { select: { name: true } }, attendanceDays: { where: { date: parseDateValue(new URL(request.url).searchParams.get("date")) }, include: { attendances: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(sortClasses(classes))
  } catch { return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }) }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json() as { classId: string; date?: string; records: Array<{ studentId: string; status: string; note?: string }> }
    const cls = await prisma.schoolClass.findUnique({ where: { id: body.classId } })
    if (!cls || (user.role === "GURU" && cls.homeroomUserId !== user.id)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 })
    if (body.records.some((r) => !["HADIR","SAKIT","IZIN","ALFA","DISPENSASI"].includes(r.status))) return NextResponse.json({ error: "Semua status wajib diisi" }, { status: 400 })
    const date = parseDateValue(body.date)
    if (date > startOfToday()) return NextResponse.json({ error: "Tanggal absensi tidak boleh di masa depan" }, { status: 400 })
    await prisma.$transaction(async (tx) => {
      const day = await tx.attendanceDay.upsert({ where: { classId_date: { classId: body.classId, date } }, update: { submittedById: user.id, submittedAt: new Date() }, create: { classId: body.classId, date, submittedById: user.id } })
      for (const r of body.records) await tx.attendance.upsert({ where: { attendanceDayId_studentId: { attendanceDayId: day.id, studentId: r.studentId } }, update: { status: r.status as never, note: r.note }, create: { attendanceDayId: day.id, studentId: r.studentId, status: r.status as never, note: r.note } })
    })
    return NextResponse.json({ ok: true, submittedAt: new Date().toISOString() })
  } catch { return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 400 }) }
}
