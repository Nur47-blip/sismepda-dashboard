"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Search, Trash2, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Student = { id: string; nisn: string; name: string; className: string; active: boolean }
type EditValues = { nisn: string; name: string; className: string }

export function StudentManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [editing, setEditing] = useState<Student | null>(null)
  const [values, setValues] = useState<EditValues>({ nisn: "", name: "", className: "" })
  const [statusTarget, setStatusTarget] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  async function loadStudents() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/students")
      if (!response.ok) throw new Error()
      const data = await response.json()
      setStudents(data.students)
      setClasses(data.classes)
    } catch { toast.error("Data siswa gagal dimuat") }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadStudents() }, [])

  const filtered = useMemo(() => students.filter((student) => {
    const keyword = query.trim().toLowerCase()
    const matchesQuery = !keyword || student.name.toLowerCase().includes(keyword) || student.nisn.includes(keyword)
    const matchesClass = classFilter === "all" || student.className === classFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? student.active : !student.active)
    return matchesQuery && matchesClass && matchesStatus
  }), [students, query, classFilter, statusFilter])

  function openEdit(student: Student) {
    setEditing(student)
    setValues({ nisn: student.nisn, name: student.name, className: student.className })
  }

  async function patchStudent(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/students", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? "Data siswa gagal diperbarui")
    setStudents((current) => current.map((student) => student.id === data.id ? data : student))
  }

  async function saveEdit() {
    if (!editing || !/^\d{10}$/.test(values.nisn) || !values.name.trim() || !values.className) {
      toast.error("Lengkapi nama, 10 digit NISN, dan kelas")
      return
    }
    setSaving(true)
    try {
      await patchStudent({ id: editing.id, nisn: values.nisn, name: values.name.trim(), className: values.className })
      setEditing(null)
      toast.success("Data siswa berhasil diperbarui")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Data siswa gagal diperbarui") }
    finally { setSaving(false) }
  }

  async function changeStatus() {
    if (!statusTarget) return
    setSaving(true)
    try {
      await patchStudent({ id: statusTarget.id, active: !statusTarget.active })
      toast.success(statusTarget.active ? "Siswa berhasil dinonaktifkan" : "Siswa berhasil diaktifkan")
      setStatusTarget(null)
    } catch (error) { toast.error(error instanceof Error ? error.message : "Status siswa gagal diperbarui") }
    finally { setSaving(false) }
  }

  async function deleteStudent() {
    if (!deleteTarget || deleteConfirmation !== deleteTarget.nisn) return
    setSaving(true)
    try {
      const response = await fetch("/api/admin/students", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id, confirmationNisn: deleteConfirmation }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Siswa gagal dihapus permanen")
      setStudents((current) => current.filter((student) => student.id !== deleteTarget.id))
      setDeleteTarget(null)
      setDeleteConfirmation("")
      toast.success("Siswa dihapus permanen", { description: `${data.deletedAttendances} record absensi ikut dihapus.` })
    } catch (error) { toast.error(error instanceof Error ? error.message : "Siswa gagal dihapus permanen") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau NISN..." className="pl-9" />
          </div>
          <Select value={classFilter} onValueChange={(value) => value && setClassFilter(value)}>
            <SelectTrigger><SelectValue placeholder="Semua kelas" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Semua kelas</SelectItem>{classes.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
            <SelectTrigger><SelectValue placeholder="Status siswa" /></SelectTrigger>
            <SelectContent><SelectItem value="active">Siswa aktif</SelectItem><SelectItem value="inactive">Siswa nonaktif</SelectItem><SelectItem value="all">Semua status</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>Nama Siswa</TableHead><TableHead>NISN</TableHead><TableHead>Kelas</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /></TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Tidak ada siswa yang sesuai.</TableCell></TableRow> : filtered.map((student) => (
            <TableRow key={student.id} className={!student.active ? "opacity-65" : undefined}>
              <TableCell className="font-medium">{student.name}</TableCell><TableCell className="font-mono text-sm">{student.nisn}</TableCell><TableCell>{student.className}</TableCell>
              <TableCell><Badge variant={student.active ? "default" : "secondary"}>{student.active ? "Aktif" : "Nonaktif"}</Badge></TableCell>
              <TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(student)}><Pencil className="size-4" /> Edit</Button><Button variant="outline" size="sm" onClick={() => setStatusTarget(student)}>{student.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}{student.active ? "Nonaktifkan" : "Aktifkan"}</Button><Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setDeleteTarget(student); setDeleteConfirmation("") }}><Trash2 className="size-4" /> Hapus</Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></div></CardContent></Card>
      <p className="text-sm text-muted-foreground">Menampilkan {filtered.length} dari {students.length} siswa.</p>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open && !saving) setEditing(null) }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Edit data siswa</DialogTitle><DialogDescription>Perubahan identitas dan kelas tidak menghapus riwayat absensi.</DialogDescription></DialogHeader>
        <div className="space-y-4"><div className="space-y-1.5"><Label htmlFor="edit-name">Nama lengkap</Label><Input id="edit-name" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></div><div className="space-y-1.5"><Label htmlFor="edit-nisn">NISN</Label><Input id="edit-nisn" inputMode="numeric" maxLength={10} value={values.nisn} onChange={(event) => setValues((current) => ({ ...current, nisn: event.target.value.replace(/\D/g, "").slice(0, 10) }))} /></div><div className="space-y-1.5"><Label>Kelas</Label><Select value={values.className} onValueChange={(value) => value && setValues((current) => ({ ...current, className: value }))}><SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger><SelectContent>{classes.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div></div>
        <DialogFooter><DialogClose render={<Button variant="outline" disabled={saving} />}>Batal</DialogClose><Button onClick={saveEdit} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => { if (!open && !saving) setStatusTarget(null) }}><DialogContent><DialogHeader><DialogTitle>{statusTarget?.active ? "Nonaktifkan siswa?" : "Aktifkan kembali siswa?"}</DialogTitle><DialogDescription>{statusTarget?.active ? `${statusTarget.name} tidak akan muncul dalam input absensi berikutnya. Riwayat absensinya tetap tersimpan.` : `${statusTarget?.name} akan kembali muncul dalam daftar siswa dan input absensi.`}</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" disabled={saving} />}>Batal</DialogClose><Button variant={statusTarget?.active ? "destructive" : "default"} onClick={changeStatus} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}{statusTarget?.active ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !saving) { setDeleteTarget(null); setDeleteConfirmation("") } }}><DialogContent><DialogHeader><DialogTitle>Hapus siswa secara permanen?</DialogTitle><DialogDescription>Tindakan ini akan menghapus {deleteTarget?.name} dan seluruh riwayat absensinya. Data tidak dapat dipulihkan. Ketik NISN siswa untuk mengonfirmasi.</DialogDescription></DialogHeader><div className="space-y-1.5"><Label htmlFor="delete-nisn">Ketik NISN {deleteTarget?.nisn}</Label><Input id="delete-nisn" inputMode="numeric" autoComplete="off" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Masukkan 10 digit NISN" /></div><DialogFooter><DialogClose render={<Button variant="outline" disabled={saving} />}>Batal</DialogClose><Button variant="destructive" onClick={deleteStudent} disabled={saving || deleteConfirmation !== deleteTarget?.nisn}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}{saving ? "Menghapus..." : "Hapus Permanen"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
