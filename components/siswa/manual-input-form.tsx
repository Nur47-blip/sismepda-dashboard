"use client"

import { useRef, useState } from "react"
import { Loader2, Save, UserPlus, CircleCheckBig, CircleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  registerStudent,
  registeredStudentName,
  studentClassOptions,
  validateManual,
  type ManualErrors,
} from "@/lib/student-input"

type SavedInfo = { nama: string; kelas: string }

export function ManualInputForm() {
  const [nisn, setNisn] = useState("")
  const [nama, setNama] = useState("")
  const [kelas, setKelas] = useState("")

  const [touched, setTouched] = useState(false)
  const [errors, setErrors] = useState<ManualErrors>({})
  const [saving, setSaving] = useState<"single" | "again" | null>(null)

  const [successInfo, setSuccessInfo] = useState<SavedInfo | null>(null)
  const [duplicateInfo, setDuplicateInfo] = useState<{ nisn: string; nama: string } | null>(null)
  const [saveError, setSaveError] = useState(false)

  const nisnRef = useRef<HTMLInputElement>(null)

  const liveErrors = touched ? validateManual({ nisn, nama, kelas }) : {}

  function handleNisnChange(value: string) {
    // Hanya angka, maksimal 10 digit, disimpan sebagai string (nol depan dipertahankan)
    const digits = value.replace(/\D/g, "").slice(0, 10)
    setNisn(digits)
  }

  async function runSave(mode: "single" | "again") {
    setTouched(true)
    const validation = validateManual({ nisn, nama, kelas })
    setErrors(validation)

    // Kasus khusus: NISN duplikat -> tampilkan dialog informatif
    if (validation.nisn === "NISN sudah terdaftar pada siswa lain") {
      const existing = registeredStudentName(nisn) ?? "siswa lain"
      setDuplicateInfo({ nisn, nama: existing })
      return
    }

    if (Object.keys(validation).length > 0) return

    setSaving(mode)
    setSaveError(false)

    try {
      const response = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nisn, name: nama.trim(), className: kelas }) })
      if (!response.ok) {
        if (response.status === 409) setDuplicateInfo({ nisn, nama: "siswa lain" })
        throw new Error("Gagal menyimpan")
      }
        const cleanNama = nama.trim()
        setSaving(null)

        if (mode === "single") {
          setSuccessInfo({ nama: cleanNama, kelas })
        } else {
          // Simpan & Tambah Lagi: kosongkan NISN & nama, pertahankan kelas, fokus ke NISN
          setNisn("")
          setNama("")
          setTouched(false)
          setErrors({})
          toast.success("Siswa berhasil ditambahkan", {
            description: `${cleanNama} • ${kelas}`,
          })
          window.setTimeout(() => nisnRef.current?.focus(), 30)
        }
      } catch {
        setSaving(null)
        setSaveError(true)
      }
  }

  const nisnError = errors.nisn && touched ? errors.nisn : liveErrors.nisn
  const namaError = errors.nama && touched ? errors.nama : liveErrors.nama
  const kelasError = errors.kelas && touched ? errors.kelas : liveErrors.kelas

  return (
    <>
      <Card className="max-w-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-primary" />
            Data Siswa Baru
          </CardTitle>
          <CardDescription>
            Lengkapi data berikut untuk menambahkan satu siswa ke sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              runSave("single")
            }}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* NISN */}
              <div className="space-y-1.5">
                <Label htmlFor="nisn">
                  NISN <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nisn"
                  ref={nisnRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Masukkan 10 digit NISN"
                  value={nisn}
                  onChange={(e) => handleNisnChange(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={Boolean(nisnError)}
                  aria-describedby="nisn-help"
                />
                <p
                  id="nisn-help"
                  className={cn(
                    "text-xs",
                    nisnError ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {nisnError ?? "NISN harus terdiri dari 10 digit angka."}
                </p>
              </div>

              {/* Nama lengkap */}
              <div className="space-y-1.5">
                <Label htmlFor="nama">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nama"
                  type="text"
                  autoComplete="off"
                  placeholder="Masukkan nama lengkap siswa"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={Boolean(namaError)}
                />
                {namaError ? (
                  <p className="text-xs text-destructive">{namaError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nama akan ditampilkan sesuai penulisan Anda.
                  </p>
                )}
              </div>
            </div>

            {/* Kelas */}
            <div className="space-y-1.5 md:max-w-[calc(50%-0.625rem)]">
              <Label htmlFor="kelas">
                Kelas <span className="text-destructive">*</span>
              </Label>
              <Select
                value={kelas}
                onValueChange={(v) => {
                  if (!v) return
                  setKelas(v)
                  setErrors((prev) => ({ ...prev, kelas: undefined }))
                }}
              >
                <SelectTrigger id="kelas" className="w-full bg-card" aria-invalid={Boolean(kelasError)}>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {studentClassOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {kelasError ? <p className="text-xs text-destructive">{kelasError}</p> : null}
            </div>

            {saveError ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-2">
                  <p>Data siswa gagal disimpan. Silakan coba kembali.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => runSave("single")}
                  >
                    Coba Lagi
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button type="submit" disabled={saving !== null}>
                {saving === "single" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving === "single" ? "Menyimpan..." : "Simpan Siswa"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving !== null}
                onClick={() => runSave("again")}
              >
                {saving === "again" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {saving === "again" ? "Menyimpan..." : "Simpan & Tambah Lagi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog sukses */}
      <Dialog open={Boolean(successInfo)} onOpenChange={(o) => !o && setSuccessInfo(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader className="items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-[var(--chart-1)]/12 text-[var(--chart-1)]">
              <CircleCheckBig className="size-7" />
            </span>
            <DialogTitle className="text-lg">Data siswa berhasil disimpan</DialogTitle>
            <DialogDescription>
              {successInfo
                ? `${successInfo.nama} berhasil ditambahkan ke kelas ${successInfo.kelas}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              className="w-full sm:w-auto sm:min-w-32"
              onClick={() => {
                // Kosongkan seluruh field setelah OK agar siap input berikutnya
                setNisn("")
                setNama("")
                setKelas("")
                setTouched(false)
                setErrors({})
                setSuccessInfo(null)
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog NISN duplikat */}
      <Dialog open={Boolean(duplicateInfo)} onOpenChange={(o) => !o && setDuplicateInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleAlert className="size-5 text-[var(--chart-4)]" />
              NISN sudah terdaftar
            </DialogTitle>
            <DialogDescription>
              {duplicateInfo
                ? `NISN ${duplicateInfo.nisn} sudah digunakan oleh siswa ${duplicateInfo.nama}. Data tidak disimpan.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button />}>Kembali</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
