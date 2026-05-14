"use client"

import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function DatePicker({ value, onChange, className }: DatePickerProps) {
  const selected = value ? new Date(value + "T00:00:00") : null
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(selected?.getFullYear() || new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const isSelected = useCallback(
    (day: number) => {
      if (!selected) return false
      const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      return d === value
    },
    [selected, viewYear, viewMonth, value],
  )

  const isToday = useCallback(
    (day: number) => {
      const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      return d === today
    },
    [viewYear, viewMonth, today],
  )

  const handleSelect = (day: number) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    onChange(d)
    setOpen(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const displayValue = selected
    ? `${MONTHS[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()}`
    : ""

  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm transition-all duration-300 text-left",
          "focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/15",
          "dark:border-slate-700/80 dark:bg-slate-950/45 dark:text-slate-100",
          !displayValue && "text-slate-400 dark:text-slate-500",
        )}
      >
        {displayValue || "Select a date"}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-[280px] origin-top-left rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {DAYS.map((d) => (
              <div
                key={d}
                className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-all duration-150",
                    isSelected(day)
                      ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md"
                      : isToday(day)
                        ? "border border-cyan-400/50 text-cyan-700 dark:text-cyan-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  )}
                >
                  {day}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false) }}
            className="mt-3 w-full rounded-xl border border-slate-200/80 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700/80 dark:hover:bg-slate-800"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
