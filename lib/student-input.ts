import { classes } from "@/lib/dashboard-data"

// Daftar kelas yang tersedia di sistem (berasal dari data sekolah).
// Nantinya berasal dari database; untuk preview memakai data yang sudah ada.
export const studentClassOptions: string[] = classes.map((c) => c.name)

const validClassSet = new Set(studentClassOptions.map((c) => c.toLowerCase()))

export function isValidClass(kelas: string): boolean {
  return validClassSet.has(kelas.trim().toLowerCase())
}

// Simulasi data NISN yang sudah terdaftar di database.
// Key: NISN (string, 10 digit), Value: nama siswa.
export const registeredNisn: Record<string, string> = {
  "0012345678": "Ahmad Fauzan",
  "0012345679": "Aisyah Putri Ramadhani",
  "0023456781": "Dewi Lestari",
  "0023456782": "Fajar Nugroho",
  "0034567891": "Gita Anindya",
  "0034567892": "Hendra Saputra",
}

export function isNisnRegistered(nisn: string): boolean {
  return Boolean(registeredNisn[nisn.trim()])
}

export function registeredStudentName(nisn: string): string | undefined {
  return registeredNisn[nisn.trim()]
}

// Menambahkan NISN ke registry (simulasi insert ke database).
export function registerStudent(nisn: string, nama: string): void {
  registeredNisn[nisn.trim()] = nama.trim()
}

const NISN_PATTERN = /^\d{10}$/

export function isValidNisnFormat(nisn: string): boolean {
  return NISN_PATTERN.test(nisn.trim())
}

// ---------- Validasi form manual ----------

export type ManualErrors = {
  nisn?: string
  nama?: string
  kelas?: string
}

export function validateManual(values: {
  nisn: string
  nama: string
  kelas: string
}): ManualErrors {
  const errors: ManualErrors = {}
  const nisn = values.nisn.trim()
  const nama = values.nama.trim()

  if (!nisn) {
    errors.nisn = "NISN wajib diisi"
  } else if (!isValidNisnFormat(nisn)) {
    errors.nisn = "NISN harus terdiri dari 10 digit angka"
  } else if (isNisnRegistered(nisn)) {
    errors.nisn = "NISN sudah terdaftar pada siswa lain"
  }

  if (!nama) {
    errors.nama = "Nama lengkap wajib diisi"
  }

  if (!values.kelas) {
    errors.kelas = "Kelas wajib dipilih"
  }

  return errors
}

// ---------- Parsing & validasi CSV ----------

export const CSV_HEADERS = ["nisn", "nama_lengkap", "kelas"] as const

export type CsvRowStatus =
  | "valid"
  | "nisn_terdaftar"
  | "nisn_kosong"
  | "nisn_tidak_valid"
  | "nisn_duplikat_file"
  | "nama_kosong"
  | "kelas_kosong"
  | "kelas_tidak_ditemukan"

export type CsvRow = {
  baris: number
  nisn: string
  nama: string
  kelas: string
  status: CsvRowStatus
}

export type CsvParseResult =
  | { ok: false; error: "empty" | "header" ; headerFound?: string }
  | {
      ok: true
      rows: CsvRow[]
      valid: number
      duplicateDb: number
      problem: number
      total: number
    }

function splitCsvLine(line: string): string[] {
  return line.split(",").map((c) => c.trim())
}

export function parseCsv(text: string): CsvParseResult {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0)

  if (lines.length === 0) {
    return { ok: false, error: "empty" }
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
  const headerMatches =
    header.length >= 3 &&
    header[0] === CSV_HEADERS[0] &&
    header[1] === CSV_HEADERS[1] &&
    header[2] === CSV_HEADERS[2]

  if (!headerMatches) {
    return { ok: false, error: "header", headerFound: lines[0] }
  }

  const dataLines = lines.slice(1)
  if (dataLines.length === 0) {
    return { ok: false, error: "empty" }
  }

  // Hitung kemunculan NISN untuk deteksi duplikat di dalam file.
  const nisnSeen = new Map<string, number>()
  for (const line of dataLines) {
    const cells = splitCsvLine(line)
    const nisn = (cells[0] ?? "").trim()
    if (nisn) nisnSeen.set(nisn, (nisnSeen.get(nisn) ?? 0) + 1)
  }

  const rows: CsvRow[] = dataLines.map((line, index) => {
    const cells = splitCsvLine(line)
    const nisn = (cells[0] ?? "").trim()
    const nama = (cells[1] ?? "").trim()
    const kelas = (cells[2] ?? "").trim()
    const baris = index + 2 // baris 1 adalah header

    let status: CsvRowStatus = "valid"
    if (!nisn) {
      status = "nisn_kosong"
    } else if (!isValidNisnFormat(nisn)) {
      status = "nisn_tidak_valid"
    } else if ((nisnSeen.get(nisn) ?? 0) > 1) {
      status = "nisn_duplikat_file"
    } else if (isNisnRegistered(nisn)) {
      status = "nisn_terdaftar"
    } else if (!nama) {
      status = "nama_kosong"
    } else if (!kelas) {
      status = "kelas_kosong"
    } else if (!isValidClass(kelas)) {
      status = "kelas_tidak_ditemukan"
    }

    return { baris, nisn, nama, kelas, status }
  })

  const valid = rows.filter((r) => r.status === "valid").length
  const duplicateDb = rows.filter((r) => r.status === "nisn_terdaftar").length
  const problem = rows.length - valid - duplicateDb

  return {
    ok: true,
    rows,
    valid,
    duplicateDb,
    problem,
    total: rows.length,
  }
}

export const csvStatusMeta: Record<
  CsvRowStatus,
  { label: string; tone: "valid" | "skip" | "error" }
> = {
  valid: { label: "Valid", tone: "valid" },
  nisn_terdaftar: { label: "NISN sudah terdaftar", tone: "skip" },
  nisn_kosong: { label: "NISN kosong", tone: "error" },
  nisn_tidak_valid: { label: "NISN tidak valid", tone: "error" },
  nisn_duplikat_file: { label: "NISN duplikat di file", tone: "error" },
  nama_kosong: { label: "Nama lengkap kosong", tone: "error" },
  kelas_kosong: { label: "Kelas kosong", tone: "error" },
  kelas_tidak_ditemukan: { label: "Kelas tidak ditemukan", tone: "error" },
}

export const CSV_TEMPLATE = `nisn,nama_lengkap,kelas
0090001111,Ahmad Fauzan,VII A
0090002222,Aisyah Putri Ramadhani,VII A
0090003333,Bagas Aditya Pratama,VII B`
