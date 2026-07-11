"use client"

import { CalendarDays, Plus, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DashboardHeaderProps = {
  selectedClass: string
  onClassChange: (value: string) => void
  classes: Array<{ id: string; name: string }>
}

const todayLabel = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date())

export function DashboardHeader({ selectedClass, onClassChange, classes }: DashboardHeaderProps) {
  const classOptions = [{ value: "all", label: "Semua Kelas" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <span className="hidden size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary sm:flex">
          <GraduationCap className="size-6" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Ringkasan absensi dan kelengkapan input hari ini
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm">
          <CalendarDays className="size-4 text-primary" />
          <span className="whitespace-nowrap">{todayLabel}</span>
        </div>

        <Select value={selectedClass} onValueChange={(value) => value && onClassChange(value)}>
          <SelectTrigger className="w-full bg-card shadow-sm sm:w-44">
            <SelectValue placeholder="Pilih kelas">
              {(value: string) =>
                classOptions.find((o) => o.value === value)?.label ?? "Pilih kelas"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {classOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button className="shadow-sm" render={<Link href="/absensi/input" />}>
          <Plus className="size-4" />
          Input Absensi
        </Button>
      </div>
    </header>
  )
}
