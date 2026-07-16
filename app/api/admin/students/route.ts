import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import { sortClasses } from "@/lib/class-order"

const optionalNis = z.string().trim().max(30).regex(/^\d+$/).or(z.literal("")).transform((value) => value || null)
const optionalNisn = z.string().trim().regex(/^\d{10}$/).or(z.literal("")).transform((value) => value || null)

const identifiers = z.object({ nis: optionalNis, nisn: optionalNisn }).refine(
  (value) => value.nis !== null || value.nisn !== null,
  { message: "Minimal salah satu NIS atau NISN wajib diisi" },
)

const student = z.object({
  nis: optionalNis.default(""),
  nisn: optionalNisn.default(""),
  name: z.string().trim().min(1),
  className: z.string().min(1),
}).refine((value) => value.nis !== null || value.nisn !== null, {
  message: "Minimal salah satu NIS atau NISN wajib diisi",
})

function isDuplicateError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002"
}

function studentResponse(studentData: {
  id: string
  nis: string | null
  nisn: string | null
  name: string
  active: boolean
  schoolClass: { name: string }
}) {
  const { schoolClass, ...item } = studentData
  return { ...item, className: schoolClass.name }
}

export async function GET() {
  try {
    await requireAdmin()
    const [classes, students] = await Promise.all([
      prisma.schoolClass.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
      prisma.student.findMany({
        select: { id: true, nis: true, nisn: true, name: true, active: true, schoolClass: { select: { name: true } } },
        orderBy: [{ active: "desc" }, { name: "asc" }],
      }),
    ])
    return NextResponse.json({
      classes: sortClasses(classes).map((item) => item.name),
      students: students.map(studentResponse),
    })
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 })
  }
}

const studentUpdate = z.object({
  id: z.string().min(1),
  nis: optionalNis.optional(),
  nisn: optionalNisn.optional(),
  name: z.string().trim().min(1).optional(),
  className: z.string().min(1).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
    const body = studentUpdate.parse(await request.json())
    const existing = await prisma.student.findUnique({ where: { id: body.id }, select: { nis: true, nisn: true } })
    if (!existing) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    identifiers.parse({ nis: body.nis === undefined ? existing.nis ?? "" : body.nis ?? "", nisn: body.nisn === undefined ? existing.nisn ?? "" : body.nisn ?? "" })

    const schoolClass = body.className
      ? await prisma.schoolClass.findUnique({ where: { name: body.className }, select: { id: true } })
      : null
    if (body.className && !schoolClass) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 400 })

    const updated = await prisma.student.update({
      where: { id: body.id },
      data: {
        ...(body.nis !== undefined ? { nis: body.nis } : {}),
        ...(body.nisn !== undefined ? { nisn: body.nisn } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(schoolClass ? { classId: schoolClass.id } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
      include: { schoolClass: { select: { name: true } } },
    })
    return NextResponse.json(studentResponse(updated))
  } catch (error) {
    const duplicate = isDuplicateError(error)
    return NextResponse.json(
      { error: duplicate ? "NIS atau NISN sudah digunakan siswa lain" : "Data siswa tidak valid" },
      { status: duplicate ? 409 : 400 },
    )
  }
}

const studentDelete = z.object({ id: z.string().min(1), confirmationIdentifier: z.string().min(1) })

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    const body = studentDelete.parse(await request.json())
    const existing = await prisma.student.findUnique({ where: { id: body.id }, select: { nis: true, nisn: true } })
    if (!existing) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    const expectedIdentifier = existing.nis ?? existing.nisn
    if (expectedIdentifier !== body.confirmationIdentifier) {
      return NextResponse.json({ error: "Konfirmasi identitas siswa tidak sesuai" }, { status: 400 })
    }
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
      await prisma.student.create({ data: { nis: row.nis, nisn: row.nisn, name: row.name, classId: cls.id } })
      count += 1
    }
    return NextResponse.json({ count }, { status: 201 })
  } catch (error) {
    const duplicate = isDuplicateError(error)
    return NextResponse.json(
      { error: duplicate ? "NIS atau NISN sudah terdaftar" : "Data siswa tidak valid" },
      { status: duplicate ? 409 : 400 },
    )
  }
}
