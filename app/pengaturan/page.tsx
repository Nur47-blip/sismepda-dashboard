"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PageContainer, PageHeading } from "@/components/layout/page-container"

export default function PengaturanPage() {
  const [notifReminder, setNotifReminder] = useState(true)
  const [notifDaily, setNotifDaily] = useState(true)
  const [notifWeekly, setNotifWeekly] = useState(false)
  const [autoLock, setAutoLock] = useState(true)
  const [schoolName, setSchoolName] = useState("SMP Negeri 1 Contoh")
  const [npsn, setNpsn] = useState("20200123")
  const [academicYear, setAcademicYear] = useState("2025/2026")
  const [semester, setSemester] = useState("Ganjil")
  const [openTime, setOpenTime] = useState("06:30")
  const [closeTime, setCloseTime] = useState("08:00")
  const [saving, setSaving] = useState(false)
  useEffect(() => { fetch("/api/admin/settings").then((r) => r.json()).then((s) => { setSchoolName(s.schoolName); setNpsn(s.npsn ?? ""); setAcademicYear(s.academicYear); setSemester(s.semester); setOpenTime(s.attendanceOpenTime); setCloseTime(s.attendanceCloseTime); setAutoLock(s.autoLock) }) }, [])
  async function save() { setSaving(true); const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schoolName, npsn, academicYear, semester, attendanceOpenTime: openTime, attendanceCloseTime: closeTime, autoLock }) }); setSaving(false); response.ok ? toast.success("Pengaturan disimpan") : toast.error("Pengaturan gagal disimpan") }

  return (
    <PageContainer>
      <PageHeading
        title="Pengaturan"
        description="Kelola profil sekolah, waktu input absensi, dan preferensi notifikasi."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profil Sekolah</CardTitle>
          <CardDescription>Informasi umum yang tampil pada laporan absensi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Sekolah</Label>
              <Input id="nama" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="bg-card" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="npsn">NPSN</Label>
              <Input id="npsn" value={npsn} onChange={(e) => setNpsn(e.target.value)} className="bg-card" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun Ajaran</Label>
              <Input id="tahun" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="bg-card" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} className="bg-card" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waktu Input Absensi</CardTitle>
          <CardDescription>Atur batas waktu wali kelas menginput absensi harian</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mulai">Jam Buka</Label>
              <Input id="mulai" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="bg-card" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutup">Batas Akhir</Label>
              <Input id="tutup" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="bg-card" />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Kunci otomatis setelah batas waktu</p>
              <p className="text-sm text-muted-foreground">
                Wali kelas tidak dapat mengubah absensi setelah batas akhir tanpa izin admin
              </p>
            </div>
            <Switch checked={autoLock} onCheckedChange={setAutoLock} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifikasi</CardTitle>
          <CardDescription>Preferensi pengingat dan laporan otomatis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <NotifRow
            title="Pengingat input absensi"
            desc="Kirim pengingat ke wali kelas yang belum menginput"
            checked={notifReminder}
            onChange={setNotifReminder}
          />
          <Separator />
          <NotifRow
            title="Ringkasan harian"
            desc="Kirim rekap kehadiran ke kepala sekolah setiap hari"
            checked={notifDaily}
            onChange={setNotifDaily}
          />
          <Separator />
          <NotifRow
            title="Laporan mingguan"
            desc="Kirim laporan tren kehadiran setiap akhir pekan"
            checked={notifWeekly}
            onChange={setNotifWeekly}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="bg-card">
          Batal
        </Button>
        <Button onClick={save} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button>
      </div>
    </PageContainer>
  )
}

function NotifRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
