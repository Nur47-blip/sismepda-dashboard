// ---------- Prefix / sapaan ----------
// Daftar awal; admin dapat menambahkan nilai baru lewat combobox.
export const defaultPrefixOptions: string[] = [
  "Bpk.",
  "Ibu",
  "Mr.",
  "Mrs.",
  "Dr.",
  "Ust.",
  "Ustazah",
]

// ---------- Helper format ----------

// NIP hanya angka; dipertahankan sebagai string agar nol depan tidak hilang.
export function sanitizeNip(value: string): string {
  return value.replace(/\D/g, "")
}

// Rapikan spasi berlebih pada nama (tanpa mengubah kapitalisasi).
export function cleanName(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

// Normalisasi nomor telepon untuk disimpan: hapus spasi & tanda hubung.
export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, "")
}

// Format nomor Indonesia: 08xxxxxxxxxx atau +62xxxxxxxxxx (9-15 digit inti).
const PHONE_PATTERN = /^(\+62|62|0)8\d{7,13}$/

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(value))
}

// NIP: minimal 1 digit, hanya angka (tidak dibatasi ketat panjangnya).
export function isValidNipFormat(nip: string): boolean {
  return /^\d+$/.test(nip.trim())
}

// Preview nama dengan prefix, mis. "Bpk. Ahmad Santoso".
export function previewName(prefix: string, nama: string): string {
  const p = prefix.trim()
  const n = cleanName(nama)
  return [p, n].filter(Boolean).join(" ")
}

// ---------- Validasi form ----------

export type GuruErrors = {
  nip?: string
  nama?: string
  telepon?: string
  password?: string
  konfirmasi?: string
}

export function validateGuru(values: {
  nip: string
  nama: string
  telepon: string
  password: string
  konfirmasi: string
}, registeredNip: Record<string, string> = {}): GuruErrors {
  const errors: GuruErrors = {}
  const nip = values.nip.trim()
  const nama = values.nama.trim()
  const telepon = values.telepon.trim()

  if (!nip) {
    errors.nip = "NIP wajib diisi"
  } else if (!isValidNipFormat(nip)) {
    errors.nip = "NIP hanya boleh berisi angka"
  } else if (registeredNip[nip]) {
    errors.nip = "NIP sudah terdaftar"
  }

  if (!nama) {
    errors.nama = "Nama lengkap wajib diisi"
  }

  if (!telepon) {
    errors.telepon = "Nomor telepon wajib diisi"
  } else if (!isValidPhone(telepon)) {
    errors.telepon = "Format nomor telepon tidak valid"
  }

  if (!values.password) {
    errors.password = "Password wajib diisi"
  } else if (values.password.length < 8) {
    errors.password = "Password minimal 8 karakter"
  }

  if (values.password && values.konfirmasi !== values.password) {
    errors.konfirmasi = "Konfirmasi password tidak sama"
  }

  return errors
}

// ---------- Impor CSV ----------

export const GURU_CSV_HEADERS = [
  "nip",
  "sapaan",
  "nama_lengkap",
  "nomor_telepon",
  "password",
] as const

export type GuruCsvRowStatus =
  | "valid"
  | "nip_terdaftar"
  | "nip_kosong"
  | "nip_tidak_valid"
  | "nip_duplikat_file"
  | "nama_kosong"
  | "telepon_kosong"
  | "telepon_tidak_valid"
  | "password_kosong"
  | "password_lemah"

export type GuruCsvRow = {
  baris: number
  nip: string
  sapaan: string
  nama: string
  telepon: string
  password: string
  status: GuruCsvRowStatus
}

export type GuruCsvParseResult =
  | { ok: false; error: "empty" | "header"; headerFound?: string }
  | {
      ok: true
      rows: GuruCsvRow[]
      valid: number
      duplicateDb: number
      problem: number
      total: number
    }

function splitCsvLine(line: string): string[] {
  return line.split(",").map((c) => c.trim())
}

export function parseGuruCsv(text: string, registeredNip: Record<string, string> = {}): GuruCsvParseResult {
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
    header.length >= 5 &&
    GURU_CSV_HEADERS.every((h, i) => header[i] === h)

  if (!headerMatches) {
    return { ok: false, error: "header", headerFound: lines[0] }
  }

  const dataLines = lines.slice(1)
  if (dataLines.length === 0) {
    return { ok: false, error: "empty" }
  }

  // Hitung kemunculan NIP untuk deteksi duplikat di dalam file.
  const nipSeen = new Map<string, number>()
  for (const line of dataLines) {
    const cells = splitCsvLine(line)
    const nip = (cells[0] ?? "").trim()
    if (nip) nipSeen.set(nip, (nipSeen.get(nip) ?? 0) + 1)
  }

  const rows: GuruCsvRow[] = dataLines.map((line, index) => {
    const cells = splitCsvLine(line)
    const nip = (cells[0] ?? "").trim()
    const sapaan = (cells[1] ?? "").trim()
    const nama = (cells[2] ?? "").trim()
    const telepon = (cells[3] ?? "").trim()
    const password = (cells[4] ?? "").trim()
    const baris = index + 2 // baris 1 adalah header

    let status: GuruCsvRowStatus = "valid"
    if (!nip) {
      status = "nip_kosong"
    } else if (!isValidNipFormat(nip)) {
      status = "nip_tidak_valid"
    } else if ((nipSeen.get(nip) ?? 0) > 1) {
      status = "nip_duplikat_file"
    } else if (registeredNip[nip]) {
      status = "nip_terdaftar"
    } else if (!nama) {
      status = "nama_kosong"
    } else if (!telepon) {
      status = "telepon_kosong"
    } else if (!isValidPhone(telepon)) {
      status = "telepon_tidak_valid"
    } else if (!password) {
      status = "password_kosong"
    } else if (password.length < 8) {
      status = "password_lemah"
    }

    return { baris, nip, sapaan, nama, telepon, password, status }
  })

  const valid = rows.filter((r) => r.status === "valid").length
  const duplicateDb = rows.filter((r) => r.status === "nip_terdaftar").length
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

export const guruCsvStatusMeta: Record<
  GuruCsvRowStatus,
  { label: string; tone: "valid" | "skip" | "error" }
> = {
  valid: { label: "Valid", tone: "valid" },
  nip_terdaftar: { label: "NIP sudah terdaftar", tone: "skip" },
  nip_kosong: { label: "NIP kosong", tone: "error" },
  nip_tidak_valid: { label: "NIP tidak valid", tone: "error" },
  nip_duplikat_file: { label: "NIP duplikat di file", tone: "error" },
  nama_kosong: { label: "Nama lengkap kosong", tone: "error" },
  telepon_kosong: { label: "Nomor telepon kosong", tone: "error" },
  telepon_tidak_valid: { label: "Nomor telepon tidak valid", tone: "error" },
  password_kosong: { label: "Password kosong", tone: "error" },
  password_lemah: { label: "Password kurang dari 8 karakter", tone: "error" },
}

export const GURU_CSV_TEMPLATE = `nip,sapaan,nama_lengkap,nomor_telepon,password
199203112018012005,Ibu,Dewi Lestari,081234567801,rahasia123
198710222014031006,Bpk.,Rudi Hartono,081234567802,gurubaru88
199508162020122007,Ustazah,Siti Aminah,081234567803,sekolah2024`
