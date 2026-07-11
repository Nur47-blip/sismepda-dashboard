import "dotenv/config"
import { hash } from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role } from "../app/generated/prisma/client"

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum dikonfigurasi")
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const classNames = ["VII A","VII B","VII C","VII D","VIII A","VIII B","VIII C","VIII D","IX A","IX B","IX C","IX D"]

async function main() {
  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@sismepda.sch.id" },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@sismepda.sch.id",
      name: "Admin Sekolah",
      role: Role.ADMIN,
      passwordHash: await hash(process.env.SEED_ADMIN_PASSWORD ?? "admin123", 12),
    },
  })
  for (const name of classNames) {
    await prisma.schoolClass.upsert({ where: { name }, update: {}, create: { name, grade: name.split(" ")[0] } })
  }
  await prisma.schoolSetting.upsert({ where: { id: "default" }, update: {}, create: {} })
}

main().finally(() => prisma.$disconnect())
