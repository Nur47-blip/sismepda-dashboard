import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import { sortClasses } from "@/lib/class-order"

const student = z.object({ nisn: z.string().regex(/^\d{10}$/), name: z.string().min(1), className: z.string().min(1) })

export async function GET() {
  try {
    await requireAdmin()
    const [classes, students] = await Promise.all([
      prisma.schoolClass.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
      prisma.student.findMany({ select: { id: true, nisn: true, name: true, active: true, schoolClass: { select: { name: true } } }, orderBy: [{ active: "desc" }, { name: "asc" }] }),
    ])
    return NextResponse.json({ classes: sortClasses(classes).map((item) => item.name), students: students.map(({ schoolClass, ...item }) => ({ ...item, className: schoolClass.name })) })
  } catch { return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }) }
}

const studentUpdate = z.object({
  id: z.string().min(1),
  nisn: z.string().regex(/^\d{10}$/).optional(),
  name: z.string().trim().min(1).optional(),
  className: z.string().min(1).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
    const body = studentUpdate.parse(await request.json())
    const schoolClass = body.className
      ? await prisma.schoolClass.findUnique({ where: { name: body.className }, select: { id: true } })
      : null
    if (body.className && !schoolClass) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 400 })
    const updated = await prisma.student.update({
      where: { id: body.id },
      data: {
        ...(body.nisn !== undefined ? { nisn: body.nisn } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(schoolClass ? { classId: schoolClass.id } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
      include: { schoolClass: { select: { name: true } } },
    })
    return NextResponse.json({ id: updated.id, nisn: updated.nisn, name: updated.name, active: updated.active, className: updated.schoolClass.name })
  } catch (error) {
    const duplicate = typeof error === "object" && error && "code" in error && error.code === "P2002"
    return NextResponse.json({ error: duplicate ? "NISN sudah digunakan siswa lain" : "Data siswa tidak valid" }, { status: duplicate ? 409 : 400 })
  }
}

const studentDelete = z.object({ id: z.string().min(1), confirmationNisn: z.string().regex(/^\d{10}$/) })

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    const body = studentDelete.parse(await request.json())
    const existing = await prisma.student.findUnique({ where: { id: body.id }, select: { nisn: true } })
    if (!existing) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    if (existing.nisn !== body.confirmationNisn) return NextResponse.json({ error: "Konfirmasi NISN tidak sesuai" }, { status: 400 })
    const deletedAttendances = await prisma.$transaction(async (tx) => {
      const result = await tx.attendance.deleteMany({ where: { studentId: body.id } })
      await tx.student.delete({ where: { id: body.id } })
      return result.count
    })
    return NextResponse.json({ id: body.id, deletedAttendances })
  } catch {
    return NextResponse.json({ error: "Siswa gagal dihapus permanen" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const rows = z.array(student).parse(Array.isArray(body) ? body : [body])
    let count = 0
    for (const row of rows) {
      const cls = await prisma.schoolClass.findUnique({ where: { name: row.className } })
      if (!cls) throw new Error("Kelas tidak ditemukan")
      await prisma.student.create({ data: { nisn: row.nisn, name: row.name, classId: cls.id } }); count++
    }
    return NextResponse.json({ count }, { status: 201 })
  } catch (error) {
    const duplicate = typeof error === "object" && error && "code" in error && error.code === "P2002"
    return NextResponse.json({ error: duplicate ? "NISN sudah terdaftar" : "Data siswa tidak valid" }, { status: duplicate ? 409 : 400 })
  }
}
