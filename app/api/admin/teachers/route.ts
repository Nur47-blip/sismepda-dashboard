import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

const teacher = z.object({ nip: z.string().regex(/^\d+$/), name: z.string().min(1), phone: z.string().min(8), password: z.string().min(8) })

export async function GET() {
  try { await requireAdmin(); return NextResponse.json(await prisma.user.findMany({ where: { role: "GURU" }, select: { id: true, nip: true, name: true, phone: true, active: true, homeroomClass: { select: { name: true } } }, orderBy: [{ active: "desc" }, { name: "asc" }] })) }
  catch { return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }) }
}

const teacherUpdate = z.object({ id: z.string().min(1), nip: z.string().regex(/^\d+$/).optional(), name: z.string().trim().min(1).optional(), phone: z.string().min(8).optional(), password: z.string().min(8).optional(), active: z.boolean().optional() })

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
    const body = teacherUpdate.parse(await request.json())
    const updated = await prisma.user.update({ where: { id: body.id, role: "GURU" }, data: { ...(body.nip !== undefined ? { nip: body.nip } : {}), ...(body.name !== undefined ? { name: body.name } : {}), ...(body.phone !== undefined ? { phone: body.phone } : {}), ...(body.password !== undefined ? { passwordHash: await hash(body.password, 12) } : {}), ...(body.active !== undefined ? { active: body.active } : {}) }, select: { id: true, nip: true, name: true, phone: true, active: true, homeroomClass: { select: { name: true } } } })
    return NextResponse.json(updated)
  } catch (error) {
    const duplicate = typeof error === "object" && error && "code" in error && error.code === "P2002"
    return NextResponse.json({ error: duplicate ? "NIP sudah digunakan guru lain" : "Data guru tidak valid" }, { status: duplicate ? 409 : 400 })
  }
}

const teacherDelete = z.object({ id: z.string().min(1), confirmationNip: z.string().min(1) })

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin()
    const body = teacherDelete.parse(await request.json())
    const existing = await prisma.user.findUnique({ where: { id: body.id }, select: { nip: true, role: true } })
    if (!existing || existing.role !== "GURU") return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 404 })
    if (existing.nip !== body.confirmationNip) return NextResponse.json({ error: "Konfirmasi NIP tidak sesuai" }, { status: 400 })
    const reassignedSubmissions = await prisma.$transaction(async (tx) => {
      await tx.schoolClass.updateMany({ where: { homeroomUserId: body.id }, data: { homeroomUserId: null } })
      const result = await tx.attendanceDay.updateMany({ where: { submittedById: body.id }, data: { submittedById: admin.id } })
      await tx.user.delete({ where: { id: body.id } })
      return result.count
    })
    return NextResponse.json({ id: body.id, reassignedSubmissions })
  } catch { return NextResponse.json({ error: "Guru gagal dihapus permanen" }, { status: 400 }) }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const rows = z.array(teacher).parse(Array.isArray(body) ? body : [body])
    const created = []
    for (const row of rows) created.push(await prisma.user.create({ data: { nip: row.nip, name: row.name, phone: row.phone, passwordHash: await hash(row.password, 12), role: "GURU" } }))
    return NextResponse.json({ count: created.length }, { status: 201 })
  } catch (error) {
    const duplicate = typeof error === "object" && error && "code" in error && error.code === "P2002"
    return NextResponse.json({ error: duplicate ? "NIP sudah terdaftar" : "Data guru tidak valid" }, { status: duplicate ? 409 : 400 })
  }
}
