import { parseDelimitedText } from "@/lib/csv"

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
}, classOptions: string[] = [], registeredNisn: Record<string, string> = {}): ManualErrors {
  const errors: ManualErrors = {}
  const nisn = values.nisn.trim()
  const nama = values.nama.trim()

  if (!nisn) {
    errors.nisn = "NISN wajib diisi"
  } else if (!isValidNisnFormat(nisn)) {
    errors.nisn = "NISN harus terdiri dari 10 digit angka"
  } else if (registeredNisn[nisn]) {
    errors.nisn = "NISN sudah terdaftar pada siswa lain"
  }

  if (!nama) {
    errors.nama = "Nama lengkap wajib diisi"
  }

  if (!values.kelas) {
    errors.kelas = "Kelas wajib dipilih"
  } else if (!classOptions.some((item) => item.toLowerCase() === values.kelas.toLowerCase())) {
    errors.kelas = "Kelas tidak ditemukan"
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

export function parseCsv(
  text: string,
  classOptions: string[] = [],
  registeredNisn: Record<string, string> = {},
  delimiter = ",",
): CsvParseResult {
  const records = parseDelimitedText(text, delimiter)

  if (records.length === 0) {
    return { ok: false, error: "empty" }
  }

  const header = records[0].map((h) => h.trim().toLowerCase())
  const headerMatches =
    header.length >= 3 &&
    header[0] === CSV_HEADERS[0] &&
    header[1] === CSV_HEADERS[1] &&
    header[2] === CSV_HEADERS[2]

  if (!headerMatches) {
    return { ok: false, error: "header", headerFound: records[0].join(delimiter) }
  }

  const dataRecords = records.slice(1)
  if (dataRecords.length === 0) {
    return { ok: false, error: "empty" }
  }

  // Hitung kemunculan NISN untuk deteksi duplikat di dalam file.
  const nisnSeen = new Map<string, number>()
  for (const cells of dataRecords) {
    const nisn = (cells[0] ?? "").trim()
    if (nisn) nisnSeen.set(nisn, (nisnSeen.get(nisn) ?? 0) + 1)
  }

  const rows: CsvRow[] = dataRecords.map((cells, index) => {
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
    } else if (registeredNisn[nisn]) {
      status = "nisn_terdaftar"
    } else if (!nama) {
      status = "nama_kosong"
    } else if (!kelas) {
      status = "kelas_kosong"
    } else if (!classOptions.some((item) => item.toLowerCase() === kelas.toLowerCase())) {
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
