// Data & helper untuk halaman Input Data Wali Kelas.
// Untuk preview memakai data simulasi; nantinya berasal dari database.

import { classes } from "@/lib/dashboard-data"

export type Teacher = {
  id: string
  prefix: string
  nama: string
  nip: string
}

// Nama lengkap dengan prefix, mis. "Bpk. Ahmad Santoso".
export function teacherFullName(t: Teacher): string {
  return [t.prefix, t.nama].filter(Boolean).join(" ")
}

// Direktori guru (simulasi data dari database).
export const teachers: Teacher[] = [
  { id: "g1", prefix: "Bpk.", nama: "Ahmad Santoso", nip: "198705122010011001" },
  { id: "g2", prefix: "Ibu", nama: "Siti Rahmawati", nip: "199003242015022003" },
  { id: "g3", prefix: "Ibu", nama: "Sri Wahyuni", nip: "197203152000032001" },
  { id: "g4", prefix: "Bpk.", nama: "Slamet Riyadi", nip: "196805121994031002" },
  { id: "g5", prefix: "Bpk.", nama: "Agus Setiawan", nip: "198104102005011003" },
  { id: "g6", prefix: "Ibu", nama: "Nurul Hidayah", nip: "198809172011012004" },
  { id: "g7", prefix: "Bpk.", nama: "Rudi Hartono", nip: "198710222014031006" },
  { id: "g8", prefix: "Ibu", nama: "Dewi Lestari", nip: "199203112018012005" },
  { id: "g9", prefix: "Ustazah", nama: "Siti Aminah", nip: "199508162020122007" },
  { id: "g10", prefix: "Bpk.", nama: "Bambang Wijaya", nip: "197811052003121002" },
  { id: "g11", prefix: "Ibu", nama: "Retno Palupi", nip: "198502142009022001" },
  { id: "g12", prefix: "Bpk.", nama: "Hendra Gunawan", nip: "199107192016011004" },
  { id: "g13", prefix: "Dr.", nama: "Farida Ariyani", nip: "197509282001122003" },
  { id: "g14", prefix: "Bpk.", nama: "Yusuf Maulana", nip: "199404062019031005" },
  { id: "g15", prefix: "Ibu", nama: "Lestari Handayani", nip: "198311232008012006" },
]

export function getTeacher(id: string): Teacher | undefined {
  return teachers.find((t) => t.id === id)
}

export type WaliKelasClass = {
  id: string
  name: string
}

// Daftar kelas (memakai data sekolah yang sudah ada: VII A - IX I).
export const waliKelasClasses: WaliKelasClass[] = classes.map((c) => ({
  id: c.id,
  name: c.name,
}))

// Penugasan awal (simulasi): sebagian kelas sudah memiliki wali kelas.
// Map: classId -> teacherId
export const initialAssignments: Record<string, string> = {
  [waliKelasClasses[0]?.id]: "g1",
  [waliKelasClasses[1]?.id]: "g2",
  [waliKelasClasses[2]?.id]: "g3",
  [waliKelasClasses[3]?.id]: "g4",
  [waliKelasClasses[4]?.id]: "g5",
  [waliKelasClasses[5]?.id]: "g6",
  [waliKelasClasses[6]?.id]: "g7",
}
