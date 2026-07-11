import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try { await requireAdmin(); return NextResponse.json(await prisma.schoolSetting.upsert({ where: { id: "default" }, update: {}, create: {} })) }
  catch { return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }) }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(); const body = await request.json()
    const setting = await prisma.schoolSetting.upsert({ where: { id: "default" }, update: body, create: { ...body, id: "default" } })
    return NextResponse.json(setting)
  } catch { return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 400 }) }
}
