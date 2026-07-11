export type AttendanceStatus = "hadir" | "sakit" | "izin" | "alfa" | "dispensasi"

export type ClassRecord = {
  id: string
  name: string
  grade: "VII" | "VIII" | "IX"
  homeroom: string
  totalStudents: number
  hadir: number
  sakit: number
  izin: number
  alfa: number
  dispensasi: number
  submitted: boolean
  submittedAt: string | null
}

export type AbsenceHistory = {
  sakit: number
  izin: number
  alfa: number
  dispensasi: number
}

export type AbsentStudent = {
  id: string
  name: string
  className: string
  status: Exclude<AttendanceStatus, "hadir">
  note: string
  history: AbsenceHistory
}

export type ActivityItem = {
  id: string
  teacher: string
  className: string
  action: string
  time: string
  type: "input" | "edit" | "reminder"
}

const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const
const grades = ["VII", "VIII", "IX"] as const

// Wali kelas per grade (9 tiap tingkat)
const homerooms: Record<(typeof grades)[number], string[]> = {
  VII: [
    "Ibu Sri Wahyuni",
    "Bpk. Ahmad Fauzi",
    "Ibu Ratna Dewi",
    "Bpk. Budi Santoso",
    "Ibu Maya Lestari",
    "Bpk. Dedi Kurniawan",
    "Ibu Fitri Handayani",
    "Bpk. Hendra Wijaya",
    "Ibu Nur Aini",
  ],
  VIII: [
    "Bpk. Rizal Effendi",
    "Ibu Wulan Sari",
    "Bpk. Agus Salim",
    "Ibu Dewi Anggraini",
    "Bpk. Yusuf Maulana",
    "Ibu Lina Marlina",
    "Bpk. Taufik Hidayat",
    "Ibu Sinta Rahmawati",
    "Bpk. Bambang Priyono",
  ],
  IX: [
    "Ibu Endah Purnama",
    "Bpk. Joko Susilo",
    "Ibu Rina Kartika",
    "Bpk. Wahyu Nugroho",
    "Ibu Tuti Alawiyah",
    "Bpk. Slamet Riyadi",
    "Ibu Yeni Marlina",
    "Bpk. Firman Syah",
    "Ibu Desi Ratnasari",
  ],
}

// ID kelas yang belum menginput absensi hari ini
const notSubmittedIds = new Set(["vii-c", "vii-h", "viii-e", "viii-i", "ix-b", "ix-f", "ix-g"])

// Jam input per kelas yang sudah submit (dibuat menyebar)
function submittedTime(index: number) {
  const base = 6 * 60 + 52 // 06:52
  const minute = base + index * 3
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// Deterministic pseudo-random supaya data stabil antar render
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function buildClasses(): ClassRecord[] {
  const result: ClassRecord[] = []
  let submitIndex = 0

  grades.forEach((grade, gi) => {
    sections.forEach((section, si) => {
      const seedBase = gi * 100 + si
      const id = `${grade.toLowerCase()}-${section.toLowerCase()}`
      const totalStudents = 28 + Math.floor(seeded(seedBase + 1) * 7) // 28-34
      const submitted = !notSubmittedIds.has(id)

      if (!submitted) {
        result.push({
          id,
          name: `${grade} ${section}`,
          grade,
          homeroom: homerooms[grade][si],
          totalStudents,
          hadir: 0,
          sakit: 0,
          izin: 0,
          alfa: 0,
          dispensasi: 0,
          submitted: false,
          submittedAt: null,
        })
        return
      }

      const sakit = Math.floor(seeded(seedBase + 2) * 3) // 0-2
      const izin = Math.floor(seeded(seedBase + 3) * 3) // 0-2
      const alfa = Math.floor(seeded(seedBase + 4) * 2.4) // 0-2
      const dispensasi = Math.floor(seeded(seedBase + 5) * 2.4) // 0-2
      const hadir = totalStudents - sakit - izin - alfa - dispensasi

      result.push({
        id,
        name: `${grade} ${section}`,
        grade,
        homeroom: homerooms[grade][si],
        totalStudents,
        hadir,
        sakit,
        izin,
        alfa,
        dispensasi,
        submitted: true,
        submittedAt: submittedTime(submitIndex++),
      })
    })
  })

  return result
}

export const classes: ClassRecord[] = buildClasses()

export const absentStudents: AbsentStudent[] = [
  { id: "s1", name: "Andi Pratama", className: "VII A", status: "alfa", note: "Tanpa keterangan", history: { sakit: 1, izin: 0, alfa: 5, dispensasi: 0 } },
  { id: "s2", name: "Bella Safitri", className: "VII B", status: "sakit", note: "Demam, surat dokter", history: { sakit: 4, izin: 1, alfa: 0, dispensasi: 0 } },
  { id: "s3", name: "Cahyo Nugroho", className: "VII D", status: "izin", note: "Acara keluarga", history: { sakit: 2, izin: 3, alfa: 1, dispensasi: 0 } },
  { id: "s4", name: "Dinda Ayu", className: "VII E", status: "sakit", note: "Sakit, izin orang tua", history: { sakit: 6, izin: 0, alfa: 0, dispensasi: 1 } },
  { id: "s5", name: "Eka Saputra", className: "VIII A", status: "alfa", note: "Tanpa keterangan", history: { sakit: 0, izin: 1, alfa: 7, dispensasi: 0 } },
  { id: "s6", name: "Farah Nabila", className: "VIII C", status: "izin", note: "Lomba antar sekolah", history: { sakit: 1, izin: 2, alfa: 0, dispensasi: 3 } },
  { id: "s7", name: "Galih Ramadhan", className: "VIII D", status: "sakit", note: "Izin sakit", history: { sakit: 3, izin: 0, alfa: 2, dispensasi: 0 } },
  { id: "s8", name: "Hana Puspita", className: "VIII G", status: "izin", note: "Periksa kesehatan", history: { sakit: 2, izin: 4, alfa: 0, dispensasi: 0 } },
  { id: "s9", name: "Irfan Maulana", className: "IX A", status: "alfa", note: "Tanpa keterangan", history: { sakit: 0, izin: 0, alfa: 8, dispensasi: 0 } },
  { id: "s10", name: "Kirana Wulandari", className: "IX C", status: "sakit", note: "Sakit, izin orang tua", history: { sakit: 5, izin: 1, alfa: 1, dispensasi: 0 } },
  { id: "s11", name: "Lukman Hakim", className: "IX D", status: "izin", note: "Urusan keluarga", history: { sakit: 1, izin: 3, alfa: 2, dispensasi: 1 } },
  { id: "s12", name: "Mega Utami", className: "IX E", status: "alfa", note: "Tanpa keterangan", history: { sakit: 0, izin: 1, alfa: 4, dispensasi: 0 } },
  { id: "s13", name: "Naufal Zaki", className: "VII F", status: "sakit", note: "Demam", history: { sakit: 3, izin: 2, alfa: 0, dispensasi: 0 } },
  { id: "s14", name: "Oktavia Rahma", className: "VIII H", status: "izin", note: "Kegiatan OSIS", history: { sakit: 0, izin: 2, alfa: 1, dispensasi: 2 } },
  { id: "s15", name: "Putra Aditya", className: "VII A", status: "dispensasi", note: "Lomba OSN tingkat kota", history: { sakit: 1, izin: 0, alfa: 0, dispensasi: 4 } },
  { id: "s16", name: "Qori Amelia", className: "VIII A", status: "dispensasi", note: "Mewakili sekolah upacara", history: { sakit: 0, izin: 1, alfa: 0, dispensasi: 3 } },
  { id: "s17", name: "Rafi Nurhuda", className: "IX A", status: "dispensasi", note: "Tanding basket antar sekolah", history: { sakit: 2, izin: 0, alfa: 1, dispensasi: 5 } },
  { id: "s18", name: "Salma Zahira", className: "VIII D", status: "dispensasi", note: "Paskibra kota", history: { sakit: 0, izin: 0, alfa: 0, dispensasi: 6 } },
  { id: "s19", name: "Teguh Santoso", className: "IX C", status: "dispensasi", note: "Lomba karya ilmiah remaja", history: { sakit: 1, izin: 1, alfa: 0, dispensasi: 2 } },
]

export const recentActivity: ActivityItem[] = [
  { id: "a1", teacher: "Ibu Endah Purnama", className: "IX A", action: "menginput absensi", time: "06:52", type: "input" },
  { id: "a2", teacher: "Ibu Sri Wahyuni", className: "VII A", action: "menginput absensi", time: "06:58", type: "input" },
  { id: "a3", teacher: "Bpk. Rizal Effendi", className: "VIII A", action: "menginput absensi", time: "07:04", type: "input" },
  { id: "a4", teacher: "Bpk. Budi Santoso", className: "VII D", action: "mengubah status 1 siswa", time: "07:19", type: "edit" },
  { id: "a5", teacher: "Ibu Rina Kartika", className: "IX C", action: "menginput absensi", time: "07:20", type: "input" },
  { id: "a6", teacher: "Sistem", className: "7 kelas", action: "mengirim pengingat input absensi", time: "07:35", type: "reminder" },
  { id: "a7", teacher: "Ibu Sinta Rahmawati", className: "VIII H", action: "menginput absensi", time: "07:44", type: "input" },
]

// Weekly attendance trend (percentage hadir per hari)
export const weeklyTrend = [
  { day: "Sen", rate: 96 },
  { day: "Sel", rate: 94 },
  { day: "Rab", rate: 97 },
  { day: "Kam", rate: 92 },
  { day: "Jum", rate: 95 },
  { day: "Sab", rate: 90 },
]

export const classOptions = [
  { value: "all", label: "Semua Kelas" },
  ...classes.map((c) => ({ value: c.id, label: c.name })),
]

export function computeSummary(records: ClassRecord[]) {
  const totalClasses = records.length
  const submitted = records.filter((c) => c.submitted)
  const notSubmitted = records.filter((c) => !c.submitted)

  const totalHadir = records.reduce((sum, c) => sum + c.hadir, 0)
  const totalSakit = records.reduce((sum, c) => sum + c.sakit, 0)
  const totalIzin = records.reduce((sum, c) => sum + c.izin, 0)
  const totalAlfa = records.reduce((sum, c) => sum + c.alfa, 0)
  const totalDispensasi = records.reduce((sum, c) => sum + c.dispensasi, 0)

  // Only count students in submitted classes for attendance ratio
  const totalPresentEligible = submitted.reduce((sum, c) => sum + c.totalStudents, 0)
  const attendanceRate =
    totalPresentEligible > 0 ? Math.round((totalHadir / totalPresentEligible) * 100) : 0

  const totalStudentsAll = records.reduce((sum, c) => sum + c.totalStudents, 0)

  return {
    totalClasses,
    submittedCount: submitted.length,
    notSubmittedCount: notSubmitted.length,
    totalHadir,
    totalSakit,
    totalIzin,
    totalAlfa,
    totalDispensasi,
    attendanceRate,
    totalStudentsAll,
    completionRate: totalClasses > 0 ? Math.round((submitted.length / totalClasses) * 100) : 0,
  }
}

export const grades_list = grades

export function computePerGrade() {
  return grades.map((grade) => {
    const records = classes.filter((c) => c.grade === grade)
    const summary = computeSummary(records)
    return { grade, records, summary }
  })
}

export type StudentRow = {
  id: string
  name: string
  className: string
  grade: (typeof grades)[number]
  // rekap selama 20 hari sekolah
  hadir: number
  sakit: number
  izin: number
  dispensasi: number
  alfa: number
  todayStatus: AttendanceStatus
}

const firstNames = [
  "Adit", "Bunga", "Citra", "Dimas", "Eka", "Fajar", "Gita", "Hafiz", "Indah", "Joni",
  "Kanya", "Lestari", "Mahesa", "Nadia", "Omar", "Prita", "Qonita", "Rangga", "Sari", "Tegar",
  "Umar", "Vina", "Wahyu", "Xena", "Yoga", "Zahra", "Arif", "Bayu", "Cindy", "Denis",
]
const lastNames = [
  "Pratama", "Wijaya", "Lestari", "Saputra", "Anggraini", "Ramadhan", "Kusuma", "Maulana",
  "Permata", "Nugraha", "Halim", "Santoso", "Rahayu", "Firmansyah", "Utami", "Hidayat",
]

function pick<T>(arr: readonly T[], n: number) {
  return arr[Math.floor(n) % arr.length]
}

export function buildStudents(): StudentRow[] {
  const rows: StudentRow[] = []
  const school = 90 // hari sekolah sejak awal periode
  classes.forEach((cls, ci) => {
    for (let i = 0; i < cls.totalStudents; i++) {
      const seed = ci * 40 + i + 1
      const fn = pick(firstNames, seeded(seed) * 100)
      const ln = pick(lastNames, seeded(seed + 0.5) * 100)
      const sakit = Math.floor(seeded(seed + 1.3) ** 1.6 * 8) // 0-7, condong kecil
      const izin = Math.floor(seeded(seed + 2.7) ** 1.4 * 6) // 0-5
      const dispensasi = Math.floor(seeded(seed + 3.1) ** 1.8 * 4) // 0-3
      const alfa = Math.floor(seeded(seed + 4.9) ** 2 * 5) // 0-4, condong kecil
      const hadir = school - sakit - izin - dispensasi - alfa
      const r = seeded(seed + 5)
      const todayStatus: AttendanceStatus =
        r > 0.9 ? "sakit" : r > 0.85 ? "izin" : r > 0.82 ? "dispensasi" : r > 0.79 ? "alfa" : "hadir"
      rows.push({
        id: `${cls.id}-${i + 1}`,
        name: `${fn} ${ln}`,
        className: cls.name,
        grade: cls.grade,
        hadir,
        sakit,
        izin,
        dispensasi,
        alfa,
        todayStatus,
      })
    }
  })
  return rows
}

export const students: StudentRow[] = buildStudents()

export const statusMeta: Record<
  AttendanceStatus,
  { label: string; token: string; badge: string }
> = {
  hadir: { label: "Hadir", token: "var(--chart-1)", badge: "bg-[var(--chart-1)]/12 text-[var(--chart-1)]" },
  sakit: { label: "Sakit", token: "var(--chart-4)", badge: "bg-[var(--chart-4)]/15 text-[var(--chart-4)]" },
  izin: { label: "Izin", token: "var(--chart-2)", badge: "bg-[var(--chart-2)]/12 text-[var(--chart-2)]" },
  dispensasi: { label: "Dispensasi", token: "var(--chart-6)", badge: "bg-[var(--chart-6)]/15 text-[var(--chart-6)]" },
  alfa: { label: "Alfa", token: "var(--chart-5)", badge: "bg-[var(--chart-5)]/12 text-[var(--chart-5)]" },
}
