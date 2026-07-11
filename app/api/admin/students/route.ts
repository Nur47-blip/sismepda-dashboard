import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

const student = z.object({ nisn: z.string().regex(/^\d{10}$/), name: z.string().min(1), className: z.string().min(1) })

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
