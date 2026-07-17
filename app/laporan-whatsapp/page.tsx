import { ClipboardList } from "lucide-react"
import { UrlDateFilter } from "@/components/url-date-filter"
import { PageContainer, PageHeading } from "@/components/layout/page-container"
import { WhatsAppReportCard } from "@/components/reports/whatsapp-report-card"
import { Card, CardContent } from "@/components/ui/card"
import { formatLongDate, indonesiaDateValue, localDateValue, parseDateValue } from "@/lib/date"
import { getWhatsAppReportClasses } from "@/lib/server-whatsapp-report"
import { buildClassesNotSubmittedReport, buildStudentAttendanceReport } from "@/lib/whatsapp-report"

export default async function LaporanWhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const requestedDate = (await searchParams).date
  const parsedRequestedDate = requestedDate ? localDateValue(parseDateValue(requestedDate)) : null
  const date = requestedDate === parsedRequestedDate ? parsedRequestedDate : indonesiaDateValue()
  const dateLabel = formatLongDate(date)
  const classes = await getWhatsAppReportClasses(parseDateValue(date))

  return (
    <PageContainer>
      <PageHeading
        title="Laporan WhatsApp"
        description={`Siapkan laporan absensi untuk ${dateLabel} dalam format yang siap dikirim.`}
        action={<UrlDateFilter value={date} ariaLabel="Tanggal laporan WhatsApp" />}
      />

      {classes.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ClipboardList className="size-7" />
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Belum ada data kelas aktif</p>
              <p className="text-sm text-muted-foreground">
                Laporan belum dapat dibuat sampai data kelas tersedia.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid min-w-0 gap-6 xl:grid-cols-2 xl:items-start">
          <WhatsAppReportCard
            title="Rekap Absensi Siswa"
            description="Siswa tidak hadir dan siswa yang statusnya belum diisi pada setiap kelas."
            text={buildStudentAttendanceReport(dateLabel, classes)}
          />
          <WhatsAppReportCard
            title="Kelas Belum Input"
            description="Daftar kelas yang belum menyimpan absensi, dikelompokkan per tingkat."
            text={buildClassesNotSubmittedReport(dateLabel, classes)}
          />
        </div>
      )}
    </PageContainer>
  )
}
