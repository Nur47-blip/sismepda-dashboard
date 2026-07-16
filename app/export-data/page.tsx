import { ExportCenter } from "@/components/export/export-center"
import { PageContainer, PageHeading } from "@/components/layout/page-container"
import { requireUser } from "@/lib/auth-guards"
import { sortClasses } from "@/lib/class-order"
import { prisma } from "@/lib/prisma"

export default async function ExportDataPage() {
  const user = await requireUser()
  const classes = sortClasses(await prisma.schoolClass.findMany({
    where: user.role === "GURU" ? { homeroomUserId: user.id } : {},
    select: { name: true, grade: true },
    orderBy: { name: "asc" },
  }))

  return (
    <PageContainer>
      <PageHeading title="Pusat Export Data" description="Pilih data, filter, dan delimiter lalu download dalam format CSV." />
      <ExportCenter role={user.role} classes={classes} />
    </PageContainer>
  )
}
