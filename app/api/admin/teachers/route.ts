import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

const teacher = z.object({ nip: z.string().regex(/^\d+$/), name: z.string().min(1), phone: z.string().min(8), password: z.string().min(8) })

export async function GET() {
  try { await requireAdmin(); return NextResponse.json(await prisma.user.findMany({ where: { role: "GURU" }, select: { id: true, nip: true, name: true, phone: true } })) }
  catch { return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }) }
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
