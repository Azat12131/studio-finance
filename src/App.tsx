import { supabase } from "./supabase"
import React from "react"
import { createPortal } from "react-dom"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import logoWhite from "./assets/logo-white.png"
import BottomNav from "./components/BottomNav"

function App() {
  return (
    <>
      <MainPages />
      <BottomNav />
    </>
  )
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Owner = "Азат" | "Марс"
type PaymentType = "Нал" | "Карта" | "Онлайн"
type ServiceType =
  | "Запись"
  | "Сведение"
  | "Дистрибуция"
  | "Мастеринг"
  | "Другое"

type ServiceItem = {
  id: number
  type: ServiceType
  hours: number
  amount: number
}

type PaymentItem = {
  id: number
  type: PaymentType
  amount: number
}

type Operation = {
  id: number
  date: string
  client: string
  owner: Owner
  services: ServiceItem[]
  payments: PaymentItem[]
}

type MonthGoals = Record<string, number>

type FloatingPosition = {
  top: number
  left: number
  width: number
}

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
}

type CustomSelectProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: readonly T[]
  placeholder?: string
}

const RENT_GOAL = 20000
const DEFAULT_MONTH_GOAL = 150000
const ONLINE_NET_AMOUNT = 487.5

const SURFACE_RADIUS = "rounded-[30px]"
const CONTROL_RADIUS = "rounded-[20px]"
const SMALL_RADIUS = "rounded-[16px]"

const serviceOptions: readonly ServiceType[] = [
  "Запись",
  "Сведение",
  "Дистрибуция",
  "Мастеринг",
  "Другое",
]

const ownerOptions: readonly Owner[] = ["Азат", "Марс"]
const paymentOptions: readonly PaymentType[] = ["Нал", "Карта", "Онлайн"]

const fieldClassName = `
w-full rounded-[20px]
appearance-none
border border-white/10
!bg-[#20232d]
px-4 py-3 text-white outline-none
shadow-[0_1px_0_rgba(255,255,255,0.045)_inset,0_-1px_0_rgba(255,255,255,0.012)_inset,0_12px_30px_rgba(0,0,0,0.28)]
backdrop-blur-xl transition duration-200
placeholder:text-zinc-500
hover:!bg-[#252934]
focus:!bg-[#282d39]
focus:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(255,255,255,0.012)_inset,0_14px_34px_rgba(0,0,0,0.32)]
[color-scheme:dark]
`

const popupClassName = `
overflow-hidden rounded-[24px]
border border-white/[0.08]
bg-[linear-gradient(180deg,rgba(34,37,46,0.98),rgba(17,19,25,0.99))]
shadow-[0_36px_90px_rgba(0,0,0,0.72),0_1px_0_rgba(255,255,255,0.04)_inset]
backdrop-blur-[28px]
`

const rowCardClassName = `
relative rounded-[30px]
bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))]
p-4
shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_14px_30px_rgba(0,0,0,0.18)]
`

function toMonthKey(dateString: string) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseInputDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatDisplayDate(dateString: string) {
  if (!dateString) return ""
  const date = parseInputDate(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("ru-RU")
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)

  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  })
}

function formatMoney(value: number) {
  if (Number.isInteger(value)) return `${value} ₽`
  return `${value.toFixed(1)} ₽`
}

function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(year, month, 0).getDate()
}

function getPaymentsTotal(operation: Operation) {
  return operation.payments.reduce((sum, item) => sum + item.amount, 0)
}

function getServiceRevenueMap(operations: Operation[]) {
  const map = new Map<ServiceType, number>()

  operations.forEach((operation) => {
    operation.services.forEach((service) => {
      map.set(service.type, (map.get(service.type) || 0) + service.amount)
    })
  })

  return map
}

function getPaymentRevenueMap(operations: Operation[]) {
  const map = new Map<PaymentType, number>()

  operations.forEach((operation) => {
    operation.payments.forEach((payment) => {
      map.set(payment.type, (map.get(payment.type) || 0) + payment.amount)
    })
  })

  return map
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 100000)
}

function makeServiceRow(type: ServiceType = "Запись"): ServiceItem {
  return {
    id: makeId(),
    type,
    hours: 1,
    amount: type === "Запись" ? 1000 : 0,
  }
}

function makePaymentRow(type: PaymentType = "Нал"): PaymentItem {
  return {
    id: makeId(),
    type,
    amount: type === "Онлайн" ? ONLINE_NET_AMOUNT : 0,
  }
}

function normalizePayments(rawPayments: unknown): PaymentItem[] {
  if (!Array.isArray(rawPayments)) return []

  return rawPayments.map((item, index) => {
    const raw = item as Partial<PaymentItem>
    const type = (raw.type as PaymentType) || "Нал"
    const amount = type === "Онлайн" ? ONLINE_NET_AMOUNT : Number(raw.amount) || 0

    return {
      id: Number(raw.id) || makeId() + index,
      type,
      amount,
    }
  })
}

function getInitialMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function getPreviousDayString() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return formatInputDate(date)
}

function getCalendarGrid(viewDate: Date) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const jsWeekday = firstDay.getDay()
  const mondayFirstOffset = (jsWeekday + 6) % 7

  const daysInMonth = lastDay.getDate()
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  const cells: { date: Date; currentMonth: boolean }[] = []

  for (let i = mondayFirstOffset - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      currentMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: new Date(year, month, day),
      currentMonth: true,
    })
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (mondayFirstOffset + daysInMonth) + 1
    cells.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    })
  }

  return cells
}

function normalizeServiceRow(row: ServiceItem): ServiceItem {
  if (row.type === "Запись") {
    const hours = Number(row.hours) || 1
    return {
      ...row,
      hours,
      amount: hours * 1000,
    }
  }

  return {
    ...row,
    amount: Number(row.amount) || 0,
  }
}

function normalizePaymentRow(row: PaymentItem): PaymentItem {
  if (row.type === "Онлайн") {
    return {
      ...row,
      amount: ONLINE_NET_AMOUNT,
    }
  }

  return {
    ...row,
    amount: Number(row.amount) || 0,
  }
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function useFloatingPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>
) {
  const [position, setPosition] = React.useState<FloatingPosition>({
    top: 0,
    left: 0,
    width: 0,
  })

  const updatePosition = React.useCallback(() => {
    const element = anchorRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()

    setPosition({
      top: rect.bottom + window.scrollY + 12,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [anchorRef])

  React.useEffect(() => {
    if (!open) return

    updatePosition()

    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, updatePosition])

  return position
}

function useOutsideClick(
  open: boolean,
  refs: Array<React.RefObject<HTMLElement | null>>,
  onClose: () => void
) {
  React.useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node

      const clickedInside = refs.some((ref) => {
        const element = ref.current
        return element ? element.contains(target) : false
      })

      if (!clickedInside) onClose()
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [open, refs, onClose])
}

function PortalDropdown({
  open,
  anchorRef,
  panelRef,
  children,
  width,
}: {
  open: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  panelRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
  width?: number
}) {
  const position = useFloatingPosition(open, anchorRef)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[99999]" style={{ pointerEvents: "none" }}>
      <div
        ref={panelRef}
        className={popupClassName}
        style={{
          position: "absolute",
          top: position.top,
          left: position.left,
          width: width ?? position.width,
          pointerEvents: "auto",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

function GraphiteActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`${CONTROL_RADIUS} bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] px-4 py-3 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.045)_inset,0_10px_24px_rgba(0,0,0,0.14)] transition hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.03))]`}
    >
      {children}
    </button>
  )
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
}: CustomSelectProps<T>) {
  const [open, setOpen] = React.useState(false)

  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  useOutsideClick(open, [wrapperRef, panelRef], () => setOpen(false))

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${fieldClassName} flex items-center justify-between text-left`}
      >
        <span className={value ? "text-white" : "text-zinc-500"}>
          {value || placeholder || "Выбрать"}
        </span>

        <span
          className={`text-zinc-400 transition duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronDown />
        </span>
      </button>

      <PortalDropdown open={open} anchorRef={buttonRef} panelRef={panelRef}>
        <div className="p-2">
          <div className="space-y-1">
            {options.map((option) => {
              const isActive = option === value

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                  className={`w-full rounded-[16px] border px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                      : "border-transparent bg-white/[0.03] text-zinc-200 hover:border-white/8 hover:bg-white/[0.06]"
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      </PortalDropdown>
    </div>
  )
}

function CustomDatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState<Date>(
    value ? parseInputDate(value) : new Date()
  )

  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  useOutsideClick(open, [wrapperRef, panelRef], () => setOpen(false))

  React.useEffect(() => {
    if (!value) return

    const parsed = parseInputDate(value)
    if (!Number.isNaN(parsed.getTime())) {
      setViewDate(parsed)
    }
  }, [value])

  const cells = React.useMemo(() => getCalendarGrid(viewDate), [viewDate])
  const todayString = formatInputDate(new Date())
  const selectedString = value

  function selectDate(date: Date) {
    onChange(formatInputDate(date))
    setOpen(false)
  }

  function pickToday() {
    const today = formatInputDate(new Date())
    onChange(today)
    setViewDate(parseInputDate(today))
    setOpen(false)
  }

  function pickYesterday() {
    const yesterday = getPreviousDayString()
    onChange(yesterday)
    setViewDate(parseInputDate(yesterday))
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${fieldClassName} flex items-center justify-between text-left`}
      >
        <span className={value ? "text-white" : "text-zinc-500"}>
          {value ? formatDisplayDate(value) : "xx.xx.xxxx"}
        </span>

        <span className="text-zinc-400">
          <CalendarIcon />
        </span>
      </button>

      <PortalDropdown
        open={open}
        anchorRef={buttonRef}
        panelRef={panelRef}
        width={320}
      >
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-white/[0.05] text-zinc-300 transition hover:bg-white/[0.08]"
            >
              <ChevronLeft />
            </button>

            <p className="text-sm font-semibold capitalize text-white">
              {viewDate.toLocaleDateString("ru-RU", {
                month: "long",
                year: "numeric",
              })}
            </p>

            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-white/[0.05] text-zinc-300 transition hover:bg-white/[0.08]"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const cellString = formatInputDate(cell.date)
              const isSelected = cellString === selectedString
              const isToday = cellString === todayString

              return (
                <button
                  key={cellString}
                  type="button"
                  onClick={() => selectDate(cell.date)}
                  className={`h-10 rounded-[14px] text-sm transition ${
                    isSelected
                      ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                      : cell.currentMonth
                        ? "bg-white/[0.05] text-white hover:bg-white/[0.08]"
                        : "bg-transparent text-zinc-600 hover:bg-white/[0.04]"
                  } ${isToday && !isSelected ? "ring-1 ring-white/10" : ""}`}
                >
                  {cell.date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={pickToday}
              className="rounded-[14px] bg-white/[0.05] px-3 py-2 text-sm text-white transition hover:bg-white/[0.08]"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={pickYesterday}
              className="rounded-[14px] bg-white/[0.05] px-3 py-2 text-sm text-white transition hover:bg-white/[0.08]"
            >
              Вчера
            </button>
          </div>
        </div>
      </PortalDropdown>
    </div>
  )
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative ${SURFACE_RADIUS} bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] shadow-[0_16px_40px_rgba(0,0,0,0.28),0_1px_0_rgba(255,255,255,0.04)_inset,0_-1px_0_rgba(255,255,255,0.01)_inset] backdrop-blur-[24px] transition duration-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.022))] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.045)_inset,0_-1px_0_rgba(255,255,255,0.012)_inset] ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${SURFACE_RADIUS} bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012)_35%,rgba(255,255,255,0.006)_100%)] opacity-90`}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  valueClassName = "",
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <h2 className={`mt-2 text-3xl sm:text-4xl font-bold ${valueClassName}`}>{value}</h2>
    </GlassCard>
  )
}

function ModalRowCard({
  title,
  children,
  dangerAction,
}: {
  title: string
  children: React.ReactNode
  dangerAction?: React.ReactNode
}) {
  return (
    <div className={rowCardClassName}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-semibold">{title}</p>
        {dangerAction}
      </div>
      {children}
    </div>
  )
}

function MobileOperationCard({
  operation,
  onEdit,
  onDelete,
}: {
  operation: Operation
  onEdit: (operation: Operation) => void
  onDelete: (id: number) => void
}) {
  return (
    <div
      className={`${SURFACE_RADIUS} bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_14px_30px_rgba(0,0,0,0.18)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{operation.client}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {formatDisplayDate(operation.date)}
          </p>
        </div>

        <div className="rounded-[14px] bg-white/[0.06] px-3 py-2 text-right">
          <p className="text-xs text-zinc-400">Получено</p>
          <p className="text-sm font-semibold text-white">
            {formatMoney(getPaymentsTotal(operation))}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-[18px] bg-white/[0.04] p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Кто работал
          </p>
          <p className="text-sm text-white">{operation.owner}</p>
        </div>

        <div className="rounded-[18px] bg-white/[0.04] p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Оплаты
          </p>
          <div className="space-y-1">
            {operation.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-zinc-300">{payment.type}</span>
                <span className="font-medium text-white whitespace-nowrap">
                  {formatMoney(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] bg-white/[0.04] p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Услуги
          </p>
          <div className="space-y-1">
            {operation.services.map((service) => (
              <div
                key={service.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="text-zinc-300">
                  {service.type}
                  {service.type === "Запись" ? ` — ${service.hours} ч` : ""}
                </span>
                <span className="font-medium text-white whitespace-nowrap">
                  {formatMoney(service.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(operation)}
          className="flex-1 rounded-[16px] bg-white/10 px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/15"
        >
          Редактировать
        </button>
        <button
          onClick={() => onDelete(operation.id)}
          className="flex-1 rounded-[16px] bg-red-500/15 px-3 py-3 text-sm text-red-300 transition hover:bg-red-500/25"
        >
          Удалить
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const initialMonthKey = React.useMemo(() => getInitialMonthKey(), [])

  const [operations, setOperations] = React.useState<Operation[]>([])
  const [monthGoals, setMonthGoals] = React.useState<MonthGoals>({
    [initialMonthKey]: DEFAULT_MONTH_GOAL,
  })
  const [months, setMonths] = React.useState<string[]>([initialMonthKey])
  const [selectedMonth, setSelectedMonth] = React.useState(initialMonthKey)

  const [showModal, setShowModal] = React.useState(false)
  const [editingOperationId, setEditingOperationId] = React.useState<number | null>(null)

  const [client, setClient] = React.useState("")
  const [owner, setOwner] = React.useState<Owner>("Азат")
  const [operationDate, setOperationDate] = React.useState("")
  const [serviceRows, setServiceRows] = React.useState<ServiceItem[]>([makeServiceRow()])
  const [paymentRows, setPaymentRows] = React.useState<PaymentItem[]>([makePaymentRow("Нал")])

  const [lastDeleted, setLastDeleted] = React.useState<Operation | null>(null)
  const [lastAdded, setLastAdded] = React.useState<Operation | null>(null)

  const resetForm = React.useCallback(() => {
    setClient("")
    setOwner("Азат")
    setOperationDate("")
    setServiceRows([makeServiceRow()])
    setPaymentRows([makePaymentRow("Нал")])
    setEditingOperationId(null)
  }, [])

  const loadData = React.useCallback(async () => {
    const { data: operationsData, error: operationsError } = await supabase
      .from("operations")
      .select("*")
      .order("date", { ascending: false })

    const { data: goalsData, error: goalsError } = await supabase
      .from("month_goals")
      .select("*")

    if (operationsError) {
      console.error("Error loading operations", operationsError)
      return
    }

    if (goalsError) {
      console.error("Error loading goals", goalsError)
      return
    }

    const mappedOperations: Operation[] = (operationsData || []).map((item) => ({
      id: item.id,
      date: item.date,
      client: item.client,
      owner: item.owner as Owner,
      services: (item.services as ServiceItem[]) || [],
      payments: normalizePayments(item.payments),
    }))

    const goalMap: Record<string, number> = {}
    const monthSet = new Set<string>([initialMonthKey])

    ;(goalsData || []).forEach((goalRow) => {
      goalMap[goalRow.month_key] = Number(goalRow.goal)
      monthSet.add(goalRow.month_key)
    })

    mappedOperations.forEach((operation) => {
      monthSet.add(toMonthKey(operation.date))
    })

    const nextMonths = Array.from(monthSet).sort().reverse()

    setOperations(mappedOperations)
    setMonths(nextMonths)
    setMonthGoals({
      [initialMonthKey]: DEFAULT_MONTH_GOAL,
      ...goalMap,
    })
    setSelectedMonth((prev) =>
      nextMonths.includes(prev) ? prev : nextMonths[0] || initialMonthKey
    )
  }, [initialMonthKey])

  React.useEffect(() => {
    void loadData()

    const channel = supabase
      .channel("operations-and-goals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operations" },
        () => void loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "month_goals" },
        () => void loadData()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadData])

  const normalizedMonths = React.useMemo(() => {
    const all = new Set<string>(months)
    operations.forEach((operation) => all.add(toMonthKey(operation.date)))
    all.add(initialMonthKey)
    return Array.from(all).sort().reverse()
  }, [initialMonthKey, months, operations])

  const selectedMonthOperations = React.useMemo(() => {
    return operations.filter((operation) => toMonthKey(operation.date) === selectedMonth)
  }, [operations, selectedMonth])

  const sortedSelectedMonthOperations = React.useMemo(() => {
    return [...selectedMonthOperations].sort(
      (a, b) => parseInputDate(b.date).getTime() - parseInputDate(a.date).getTime()
    )
  }, [selectedMonthOperations])

  const monthIncome = React.useMemo(() => {
    return selectedMonthOperations.reduce(
      (sum, operation) => sum + getPaymentsTotal(operation),
      0
    )
  }, [selectedMonthOperations])

  const monthGoal = monthGoals[selectedMonth] ?? DEFAULT_MONTH_GOAL
  const leftToRent = Math.max(RENT_GOAL - monthIncome, 0)
  const leftToMonthGoal = Math.max(monthGoal - monthIncome, 0)
  const profitAfterRent = monthIncome - RENT_GOAL

  const azatIncome = React.useMemo(() => {
    return selectedMonthOperations
      .filter((operation) => operation.owner === "Азат")
      .reduce((sum, operation) => sum + getPaymentsTotal(operation), 0)
  }, [selectedMonthOperations])

  const marsIncome = React.useMemo(() => {
    return selectedMonthOperations
      .filter((operation) => operation.owner === "Марс")
      .reduce((sum, operation) => sum + getPaymentsTotal(operation), 0)
  }, [selectedMonthOperations])

  const serviceRevenueRows = React.useMemo(() => {
    return Array.from(getServiceRevenueMap(selectedMonthOperations).entries()).sort(
      (a, b) => b[1] - a[1]
    )
  }, [selectedMonthOperations])

  const paymentRevenueRows = React.useMemo(() => {
    const paymentRevenueMap = getPaymentRevenueMap(selectedMonthOperations)
    return paymentOptions.map((type) => [type, paymentRevenueMap.get(type) || 0] as const)
  }, [selectedMonthOperations])

  const dailyStats = React.useMemo(() => {
    const daysCount = getDaysInMonth(selectedMonth)
    const [year, month] = selectedMonth.split("-").map(Number)

    const values = Array.from({ length: daysCount }, (_, index) => ({
      day: index + 1,
      amount: 0,
      dateKey: formatInputDate(new Date(year, month - 1, index + 1)),
    }))

    selectedMonthOperations.forEach((operation) => {
      const day = parseInputDate(operation.date).getDate()
      const index = day - 1

      if (values[index]) {
        values[index].amount += getPaymentsTotal(operation)
      }
    })

    const positiveDays = values.filter((item) => item.amount > 0)
    const positiveAverage =
      positiveDays.length > 0
        ? positiveDays.reduce((sum, item) => sum + item.amount, 0) / positiveDays.length
        : 0

    const colors = values.map((item) => {
      if (item.amount === 0) return "rgba(239,68,68,0.85)"
      if (positiveAverage > 0 && item.amount < positiveAverage * 0.6) {
        return "rgba(250,204,21,0.88)"
      }
      return "rgba(34,197,94,0.86)"
    })

    const bestDays = [...values]
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)

    const weakDays = values.filter((item) => item.amount === 0).length

    return {
      values,
      colors,
      bestDays,
      weakDays,
    }
  }, [selectedMonth, selectedMonthOperations])

  const chartData = React.useMemo(() => {
    return {
      labels: dailyStats.values.map((item) => String(item.day)),
      datasets: [
        {
          label: "Выручка по дням",
          data: dailyStats.values.map((item) => item.amount),
          backgroundColor: dailyStats.colors,
          borderRadius: 14,
          barThickness: 18,
        },
      ],
    }
  }, [dailyStats])

  const chartOptions = React.useMemo<ChartOptions<"bar">>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
      },
      plugins: {
        legend: {
          labels: {
            color: "#d4d4d8",
          },
        },
        tooltip: {
          backgroundColor: "rgba(15,15,19,0.96)",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          titleColor: "#fff",
          bodyColor: "#d4d4d8",
          callbacks: {
            label(context) {
              return formatMoney(Number(context.raw))
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#8b8b95",
          },
          grid: {
            color: "rgba(255,255,255,0.035)",
          },
        },
        y: {
          ticks: {
            color: "#8b8b95",
            callback(value) {
              return formatMoney(Number(value))
            },
          },
          grid: {
            color: "rgba(255,255,255,0.035)",
          },
        },
      },
    }
  }, [])

  const currentServicesTotal = React.useMemo(() => {
    return serviceRows.reduce((sum, row) => {
      return sum + (row.type === "Запись" ? row.hours * 1000 : row.amount)
    }, 0)
  }, [serviceRows])

  const currentPaymentsTotal = React.useMemo(() => {
    return paymentRows.reduce((sum, row) => sum + row.amount, 0)
  }, [paymentRows])

  const openCreateModal = React.useCallback(() => {
    resetForm()
    setShowModal(true)
  }, [resetForm])

  const openEditModal = React.useCallback((operation: Operation) => {
    setEditingOperationId(operation.id)
    setClient(operation.client)
    setOwner(operation.owner)
    setOperationDate(operation.date)
    setServiceRows(
      operation.services.length > 0
        ? operation.services.map((service) => ({
            ...service,
            id: service.id || makeId(),
          }))
        : [makeServiceRow()]
    )
    setPaymentRows(
      operation.payments.length > 0
        ? operation.payments.map((payment) => ({
            ...payment,
            id: payment.id || makeId(),
            amount: payment.type === "Онлайн" ? ONLINE_NET_AMOUNT : payment.amount,
          }))
        : [makePaymentRow("Нал")]
    )
    setShowModal(true)
  }, [])

  const addServiceRow = React.useCallback(() => {
    setServiceRows((prev) => [...prev, makeServiceRow()])
  }, [])

  const updateServiceRow = React.useCallback((id: number, patch: Partial<ServiceItem>) => {
    setServiceRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        return normalizeServiceRow({ ...row, ...patch })
      })
    )
  }, [])

  const removeServiceRow = React.useCallback((id: number) => {
    setServiceRows((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const addPaymentRow = React.useCallback(() => {
    setPaymentRows((prev) => [...prev, makePaymentRow("Нал")])
  }, [])

  const updatePaymentRow = React.useCallback((id: number, patch: Partial<PaymentItem>) => {
    setPaymentRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        return normalizePaymentRow({ ...row, ...patch })
      })
    )
  }, [])

  const removePaymentRow = React.useCallback((id: number) => {
    setPaymentRows((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const ensureMonthExists = React.useCallback(
    async (monthKey: string) => {
      const { error } = await supabase.from("month_goals").upsert({
        month_key: monthKey,
        goal: monthGoals[monthKey] ?? DEFAULT_MONTH_GOAL,
      })

      if (error) {
        console.error("Error saving month", error)
        throw error
      }
    },
    [monthGoals]
  )

  const saveOperation = React.useCallback(async () => {
    if (!operationDate) {
      alert("Выбери дату.")
      return
    }

    if (serviceRows.length === 0) {
      alert("Добавь хотя бы одну услугу.")
      return
    }

    if (paymentRows.length === 0) {
      alert("Добавь хотя бы одну оплату.")
      return
    }

    const cleanedServices = serviceRows.map(normalizeServiceRow)
    const cleanedPayments = paymentRows.map(normalizePaymentRow)

    const hasInvalidService = cleanedServices.some((row) => row.amount <= 0)
    if (hasInvalidService) {
      alert("Во всех услугах должна быть корректная сумма.")
      return
    }

    const hasInvalidPayment = cleanedPayments.some((row) => row.amount <= 0)
    if (hasInvalidPayment) {
      alert("Во всех оплатах должна быть корректная сумма.")
      return
    }

    const payload = {
      date: operationDate,
      client: client.trim() || "Без клиента",
      owner,
      services: cleanedServices,
      payments: cleanedPayments,
    }

    const monthKey = toMonthKey(operationDate)

    try {
      await ensureMonthExists(monthKey)
    } catch {
      alert("Не удалось сохранить месяц")
      return
    }

    if (editingOperationId) {
      const { data, error } = await supabase
        .from("operations")
        .update(payload)
        .eq("id", editingOperationId)
        .select()
        .single()

      if (error) {
        console.error("Error updating operation", error)
        alert("Не удалось обновить операцию")
        return
      }

      const updatedOperation: Operation = {
        id: data.id,
        date: data.date,
        client: data.client,
        owner: data.owner as Owner,
        services: (data.services as ServiceItem[]) || [],
        payments: normalizePayments(data.payments),
      }

      setOperations((prev) =>
        prev.map((operation) =>
          operation.id === editingOperationId ? updatedOperation : operation
        )
      )
    } else {
      const { data, error } = await supabase
        .from("operations")
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error("Error creating operation", error)
        alert(`Не удалось сохранить операцию: ${error.message}`)
        return
      }

      const newOperation: Operation = {
        id: data.id,
        date: data.date,
        client: data.client,
        owner: data.owner as Owner,
        services: (data.services as ServiceItem[]) || [],
        payments: normalizePayments(data.payments),
      }

      setOperations((prev) => [...prev, newOperation])
      setLastAdded(newOperation)
    }

    setMonthGoals((prev) => ({
      ...prev,
      [monthKey]: prev[monthKey] ?? DEFAULT_MONTH_GOAL,
    }))

    setMonths((prev) => {
      if (prev.includes(monthKey)) return prev
      return [...prev, monthKey].sort().reverse()
    })

    setSelectedMonth(monthKey)
    setShowModal(false)
    resetForm()
  }, [
    client,
    editingOperationId,
    ensureMonthExists,
    operationDate,
    owner,
    paymentRows,
    resetForm,
    serviceRows,
  ])

  const createNewMonth = React.useCallback(async () => {
    const typed = prompt("Введи новый месяц в формате ГГГГ-ММ, например 2026-04")
    if (!typed) return

    const trimmed = typed.trim()
    const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)

    if (!valid) {
      alert("Неверный формат. Пример: 2026-04")
      return
    }

    try {
      await ensureMonthExists(trimmed)
    } catch {
      alert("Не удалось создать месяц")
      return
    }

    setMonths((prev) => {
      if (prev.includes(trimmed)) return prev
      return [...prev, trimmed].sort().reverse()
    })

    setMonthGoals((prev) => ({
      ...prev,
      [trimmed]: prev[trimmed] ?? DEFAULT_MONTH_GOAL,
    }))

    setSelectedMonth(trimmed)
  }, [ensureMonthExists])

  const deleteOperation = React.useCallback(
    async (id: number) => {
      const found = operations.find((operation) => operation.id === id)
      if (!found) return

      const { error } = await supabase.from("operations").delete().eq("id", id)

      if (error) {
        console.error("Error deleting operation", error)
        alert("Не удалось удалить операцию")
        return
      }

      setLastDeleted(found)
      setOperations((prev) => prev.filter((operation) => operation.id !== id))
    },
    [operations]
  )

  const undoDelete = React.useCallback(async () => {
    if (!lastDeleted) return

    const payload = {
      date: lastDeleted.date,
      client: lastDeleted.client,
      owner: lastDeleted.owner,
      services: lastDeleted.services,
      payments: lastDeleted.payments,
    }

    const { data, error } = await supabase
      .from("operations")
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error("Error restoring operation", error)
      alert("Не удалось восстановить операцию")
      return
    }

    const restored: Operation = {
      id: data.id,
      date: data.date,
      client: data.client,
      owner: data.owner as Owner,
      services: (data.services as ServiceItem[]) || [],
      payments: normalizePayments(data.payments),
    }

    setOperations((prev) => [...prev, restored])
    setLastDeleted(null)
  }, [lastDeleted])

  const undoAdd = React.useCallback(async () => {
    if (!lastAdded) return

    const { error } = await supabase.from("operations").delete().eq("id", lastAdded.id)

    if (error) {
      console.error("Error undoing add", error)
      alert("Не удалось отменить добавление")
      return
    }

    setOperations((prev) => prev.filter((operation) => operation.id !== lastAdded.id))
    setLastAdded(null)
  }, [lastAdded])

  const updateMonthGoal = React.useCallback(
    async (value: string) => {
      const numeric = Number(value)
      const nextGoal = numeric > 0 ? numeric : 0

      setMonthGoals((prev) => ({
        ...prev,
        [selectedMonth]: nextGoal,
      }))

      const { error } = await supabase.from("month_goals").upsert({
        month_key: selectedMonth,
        goal: nextGoal,
      })

      if (error) {
        console.error("Error saving month goal", error)
      }
    },
    [selectedMonth]
  )

  const deleteSelectedMonth = React.useCallback(async () => {
    if (normalizedMonths.length <= 1) {
      alert("Нельзя удалить последний месяц.")
      return
    }

    const opsForMonth = operations.filter(
      (operation) => toMonthKey(operation.date) === selectedMonth
    )

    const hasOperations = opsForMonth.length > 0

    const confirmed = window.confirm(
      hasOperations
        ? `В месяце ${formatMonthLabel(selectedMonth)} есть ${opsForMonth.length} операций. Удалить месяц вместе со всеми операциями?`
        : `Удалить пустой месяц ${formatMonthLabel(selectedMonth)}?`
    )

    if (!confirmed) return

    if (hasOperations) {
      const { error: deleteOperationsError } = await supabase
        .from("operations")
        .delete()
        .gte("date", `${selectedMonth}-01`)
        .lte("date", `${selectedMonth}-31`)

      if (deleteOperationsError) {
        console.error("Error deleting month operations", deleteOperationsError)
        alert("Не удалось удалить операции месяца")
        return
      }
    }

    const { error: deleteGoalError } = await supabase
      .from("month_goals")
      .delete()
      .eq("month_key", selectedMonth)

    if (deleteGoalError) {
      console.error("Error deleting month", deleteGoalError)
      alert("Не удалось удалить месяц")
      return
    }

    const nextMonths = normalizedMonths.filter((month) => month !== selectedMonth)

    setOperations((prev) =>
      prev.filter((operation) => toMonthKey(operation.date) !== selectedMonth)
    )
    setMonths(nextMonths)
    setMonthGoals((prev) => {
      const copy = { ...prev }
      delete copy[selectedMonth]
      return copy
    })
    setSelectedMonth(nextMonths[0] || getInitialMonthKey())
  }, [normalizedMonths, operations, selectedMonth])

  return (
    <div className="min-h-screen text-white">
      <div className="page-glow pointer-events-none" />
      <div className="page-glow-2 pointer-events-none" />
      <div className="page-glow-3 pointer-events-none" />
      <div className="noise-overlay pointer-events-none" />

      <div className="relative z-[1] flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full lg:w-[290px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 sm:p-6 shadow-[inset_-1px_0_0_rgba(255,255,255,0.018),0_20px_40px_rgba(0,0,0,0.22)] backdrop-blur-[26px]">
          <div className="mb-6 sm:mb-8">
            <div className="w-[86px] shrink-0">
              <img
                src={logoWhite}
                alt="logo"
                className="block h-auto w-full object-contain opacity-95"
              />
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="w-full rounded-[20px] bg-[linear-gradient(180deg,#6d84ff,#4c63f0)] px-4 py-4 text-base font-semibold text-white shadow-[0_16px_34px_rgba(79,101,255,0.34),0_1px_0_rgba(255,255,255,0.2)_inset] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_20px_40px_rgba(79,101,255,0.38),0_1px_0_rgba(255,255,255,0.22)_inset] active:scale-[0.99]"
          >
            + Добавить операцию
          </button>

          <button
            onClick={() => void createNewMonth()}
            className="mt-3 w-full rounded-[20px] bg-[linear-gradient(180deg,rgba(95,122,255,0.18),rgba(70,90,190,0.14))] px-4 py-4 text-base font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(255,255,255,0.018)_inset,0_12px_26px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-[1px] hover:bg-white/[0.08] active:scale-[0.99]"
          >
            + Новый месяц
          </button>

          <button
            onClick={() => void deleteSelectedMonth()}
            className="mt-3 w-full rounded-[20px] bg-[linear-gradient(180deg,rgba(170,65,125,0.22),rgba(112,58,130,0.18))] px-4 py-4 text-base font-semibold text-red-200 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(255,255,255,0.018)_inset,0_12px_26px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-[1px] hover:bg-red-500/15 active:scale-[0.99]"
          >
            − Удалить месяц
          </button>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <GlassCard className="p-4">
              <p className="text-sm text-zinc-400">Аренда</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(RENT_GOAL)}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm text-zinc-400">До аренды осталось</p>
              <p className="mt-1 text-2xl font-bold text-yellow-300">
                {formatMoney(leftToRent)}
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm text-zinc-400">Цель месяца</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(monthGoal)}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm text-zinc-400">Осталось до цели</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(leftToMonthGoal)}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm text-zinc-400">Азат</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(azatIncome)}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm text-zinc-400">Марс</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(marsIncome)}</p>
            </GlassCard>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {normalizedMonths.map((monthKey) => (
              <button
                key={monthKey}
                onClick={() => setSelectedMonth(monthKey)}
                className={`${CONTROL_RADIUS} px-4 py-2.5 text-sm font-medium capitalize transition duration-200 ${
                  selectedMonth === monthKey
                    ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] text-white shadow-[0_12px_26px_rgba(0,0,0,0.16)]"
                    : "bg-white/[0.05] text-zinc-300 shadow-[0_1px_0_rgba(255,255,255,0.045)_inset] hover:bg-white/[0.08]"
                }`}
              >
                {formatMonthLabel(monthKey)}
              </button>
            ))}
          </div>

          <GlassCard className="mb-6 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-sm text-zinc-400">Цель выбранного месяца</p>
              <input
                type="number"
                value={monthGoal}
                onChange={(e) => void updateMonthGoal(e.target.value)}
                className={`${fieldClassName} w-full sm:w-[220px]`}
              />
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <SummaryCard label="Доход" value={formatMoney(monthIncome)} valueClassName="text-green-400" />
            <SummaryCard label="Аренда" value={formatMoney(RENT_GOAL)} />
            <SummaryCard label="Осталось до аренды" value={formatMoney(leftToRent)} valueClassName="text-yellow-300" />
            <SummaryCard
              label="Чистая прибыль после аренды"
              value={formatMoney(profitAfterRent)}
              valueClassName={profitAfterRent >= 0 ? "text-green-400" : "text-red-400"}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            <GlassCard className="p-4 sm:p-6">
              <div className="mb-5">
                <p className="text-xl font-semibold">График по дням</p>
                <p className="text-sm text-zinc-400">
                  Красный — 0 клиентов, жёлтый — слабый день, зелёный — нормальный
                </p>
              </div>

              <div className="h-[280px] sm:h-[360px]">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </GlassCard>

            <div className="space-y-6">
              <GlassCard className="p-6">
                <p className="text-lg font-semibold">Самые прибыльные дни</p>
                <div className="mt-4 space-y-3">
                  {dailyStats.bestDays.length === 0 ? (
                    <p className="text-sm text-zinc-400">Пока нет данных</p>
                  ) : (
                    dailyStats.bestDays.map((day) => (
                      <div
                        key={day.dateKey}
                        className={`${CONTROL_RADIUS} bg-white/[0.05] p-3 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]`}
                      >
                        <p className="text-sm text-zinc-400">
                          {formatDisplayDate(day.dateKey)}
                        </p>
                        <p className="text-xl font-bold">{formatMoney(day.amount)}</p>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <p className="text-lg font-semibold">Просадочные дни</p>
                <div className="mt-4">
                  <p className="text-4xl font-bold text-red-400">{dailyStats.weakDays}</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    дней без клиентов в этом месяце
                  </p>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <p className="text-lg font-semibold">Доход по услугам</p>
                <div className="mt-4 space-y-3">
                  {serviceRevenueRows.length === 0 ? (
                    <p className="text-sm text-zinc-400">Пока нет данных</p>
                  ) : (
                    serviceRevenueRows.map(([serviceName, amount]) => (
                      <div
                        key={serviceName}
                        className={`flex items-center justify-between gap-4 ${CONTROL_RADIUS} bg-white/[0.05] p-3 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]`}
                      >
                        <span>{serviceName}</span>
                        <span className="font-semibold whitespace-nowrap">
                          {formatMoney(amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <p className="text-lg font-semibold">Доход по оплате</p>
                <div className="mt-4 space-y-3">
                  {paymentRevenueRows.map(([paymentName, amount]) => (
                    <div
                      key={paymentName}
                      className={`flex items-center justify-between gap-4 ${CONTROL_RADIUS} bg-white/[0.05] p-3 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]`}
                    >
                      <span>{paymentName}</span>
                      <span className="font-semibold whitespace-nowrap">
                        {formatMoney(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>

          <GlassCard className="mt-6 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xl font-semibold">История операций</p>
                <p className="text-sm text-zinc-400">Все операции выбранного месяца</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {lastAdded && (
                  <button
                    onClick={() => void undoAdd()}
                    className={`${SMALL_RADIUS} bg-yellow-500/15 px-4 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/25`}
                  >
                    Отменить добавление
                  </button>
                )}

                {lastDeleted && (
                  <button
                    onClick={() => void undoDelete()}
                    className={`${SMALL_RADIUS} bg-yellow-500/15 px-4 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/25`}
                  >
                    Отменить удаление
                  </button>
                )}
              </div>
            </div>

            {sortedSelectedMonthOperations.length === 0 ? (
              <div
                className={`${SURFACE_RADIUS} bg-white/[0.03] py-14 text-center text-zinc-400 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]`}
              >
                Пока нет операций за этот месяц
              </div>
            ) : (
              <>
                <div className="space-y-4 md:hidden">
                  {sortedSelectedMonthOperations.map((operation) => (
                    <MobileOperationCard
                      key={operation.id}
                      operation={operation}
                      onEdit={openEditModal}
                      onDelete={(id) => void deleteOperation(id)}
                    />
                  ))}
                </div>

                <div
                  className={`hidden md:block overflow-x-auto ${SURFACE_RADIUS} bg-white/[0.025] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]`}
                >
                  <table className="w-full min-w-[860px] text-left">
                    <thead className="bg-white/[0.045] text-sm text-zinc-400">
                      <tr>
                        <th className="px-4 py-3">Дата</th>
                        <th className="px-4 py-3">Клиент</th>
                        <th className="px-4 py-3">Оплаты</th>
                        <th className="px-4 py-3">Услуги</th>
                        <th className="px-4 py-3">Получено</th>
                        <th className="px-4 py-3">Кто работал</th>
                        <th className="px-4 py-3">Действия</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sortedSelectedMonthOperations.map((operation) => (
                        <tr
                          key={operation.id}
                          className="border-t border-white/[0.04] text-sm transition hover:bg-white/[0.03]"
                        >
                          <td className="px-4 py-4">{formatDisplayDate(operation.date)}</td>
                          <td className="px-4 py-4">{operation.client}</td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {operation.payments.map((payment) => (
                                <div key={payment.id} className="text-zinc-300">
                                  {payment.type} — {formatMoney(payment.amount)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {operation.services.map((service) => (
                                <div key={service.id} className="text-zinc-300">
                                  {service.type}
                                  {service.type === "Запись" ? ` — ${service.hours} ч` : ""} —{" "}
                                  {formatMoney(service.amount)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold">
                            {formatMoney(getPaymentsTotal(operation))}
                          </td>
                          <td className="px-4 py-4">{operation.owner}</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(operation)}
                                className={`${SMALL_RADIUS} bg-white/10 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/15`}
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={() => void deleteOperation(operation.id)}
                                className={`${SMALL_RADIUS} bg-red-500/15 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/25`}
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </GlassCard>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[rgba(5,5,9,0.74)] p-2 sm:p-4 backdrop-blur-[12px]">
          <div
            className={`relative w-full max-w-[98vw] sm:max-w-[95vw] lg:max-w-[860px] ${SURFACE_RADIUS} bg-[linear-gradient(180deg,rgba(34,34,40,0.98),rgba(16,16,20,0.98))] shadow-[0_30px_80px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.05)_inset]`}
          >
            <div className="max-h-[92vh] overflow-y-auto px-4 sm:px-6 pb-6 pt-5 sm:pt-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
              <div className="mb-5">
                <h2 className="text-2xl font-bold">
                  {editingOperationId ? "Редактировать операцию" : "Добавить операцию"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Один клиент может взять несколько услуг сразу
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  className={fieldClassName}
                  placeholder="Клиент"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />

                <CustomDatePicker value={operationDate} onChange={setOperationDate} />

                <CustomSelect<Owner>
                  value={owner}
                  onChange={setOwner}
                  options={ownerOptions}
                />
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-lg font-semibold">Услуги</p>
                  <GraphiteActionButton onClick={addServiceRow}>
                    + Добавить услугу
                  </GraphiteActionButton>
                </div>

                {serviceRows.map((row, index) => (
                  <ModalRowCard
                    key={row.id}
                    title={`Услуга ${index + 1}`}
                    dangerAction={
                      serviceRows.length > 1 ? (
                        <button
                          onClick={() => removeServiceRow(row.id)}
                          className="text-sm text-red-400 transition hover:text-red-300"
                        >
                          Удалить услугу
                        </button>
                      ) : undefined
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CustomSelect<ServiceType>
                        value={row.type}
                        onChange={(selectedType) =>
                          updateServiceRow(row.id, {
                            type: selectedType,
                            hours: selectedType === "Запись" ? row.hours || 1 : 0,
                            amount:
                              selectedType === "Запись"
                                ? (row.hours || 1) * 1000
                                : row.amount,
                          })
                        }
                        options={serviceOptions}
                      />

                      {row.type === "Запись" ? (
                        <input
                          type="number"
                          min={1}
                          className={fieldClassName}
                          value={row.hours}
                          onChange={(e) =>
                            updateServiceRow(row.id, {
                              hours: Number(e.target.value) || 1,
                            })
                          }
                          placeholder="Часы"
                        />
                      ) : (
                        <input
                          type="number"
                          min={0}
                          className={fieldClassName}
                          value={row.amount}
                          onChange={(e) =>
                            updateServiceRow(row.id, {
                              amount: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Сумма"
                        />
                      )}

                      <div className={`${fieldClassName} flex items-center font-semibold`}>
                        {formatMoney(row.type === "Запись" ? row.hours * 1000 : row.amount)}
                      </div>
                    </div>
                  </ModalRowCard>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">Оплата</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Для Онлайн сумма всегда фиксированная: {formatMoney(ONLINE_NET_AMOUNT)}
                    </p>
                  </div>

                  <GraphiteActionButton onClick={addPaymentRow}>
                    + Добавить оплату
                  </GraphiteActionButton>
                </div>

                {paymentRows.map((row, index) => (
                  <ModalRowCard
                    key={row.id}
                    title={`Оплата ${index + 1}`}
                    dangerAction={
                      paymentRows.length > 1 ? (
                        <button
                          onClick={() => removePaymentRow(row.id)}
                          className="text-sm text-red-400 transition hover:text-red-300"
                        >
                          Удалить оплату
                        </button>
                      ) : undefined
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomSelect<PaymentType>
                        value={row.type}
                        onChange={(selectedType) =>
                          updatePaymentRow(row.id, {
                            type: selectedType,
                            amount:
                              selectedType === "Онлайн"
                                ? ONLINE_NET_AMOUNT
                                : row.amount,
                          })
                        }
                        options={paymentOptions}
                      />

                      {row.type === "Онлайн" ? (
                        <div className={`${fieldClassName} flex items-center font-semibold`}>
                          {formatMoney(ONLINE_NET_AMOUNT)}
                        </div>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          className={fieldClassName}
                          value={row.amount}
                          onChange={(e) =>
                            updatePaymentRow(row.id, {
                              amount: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Сумма оплаты"
                        />
                      )}
                    </div>
                  </ModalRowCard>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="p-4">
                  <p className="text-sm text-zinc-400">Итог по услугам</p>
                  <p className="mt-2 text-2xl font-bold">{formatMoney(currentServicesTotal)}</p>
                </GlassCard>

                <GlassCard className="p-4">
                  <p className="text-sm text-zinc-400">Получено оплатой</p>
                  <p className="mt-2 text-2xl font-bold text-green-400">
                    {formatMoney(currentPaymentsTotal)}
                  </p>
                </GlassCard>
              </div>

              {currentPaymentsTotal !== currentServicesTotal && (
                <div className="mt-4 rounded-[20px] bg-[rgba(120,92,18,0.18)] p-4 text-sm text-yellow-100">
                  Внимание: сумма оплат и сумма услуг не совпадают. Это нормально,
                  если внесена только предоплата или оплата частями.
                </div>
              )}

              <div className="sticky bottom-0 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/10 bg-[rgba(10,12,20,0.96)] py-4 backdrop-blur-md">
                <div>
                  <p className="text-sm text-zinc-400">Фактически получено</p>
                  <p className="text-2xl font-bold">{formatMoney(currentPaymentsTotal)}</p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className={`${SMALL_RADIUS} px-4 py-3 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white w-full sm:w-auto`}
                  >
                    Отмена
                  </button>

                  <button
                    onClick={() => void saveOperation()}
                    className="rounded-[20px] bg-[linear-gradient(180deg,#2fd06e,#1ba455)] px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(27,164,85,0.26),0_1px_0_rgba(255,255,255,0.18)_inset] transition hover:brightness-110 active:scale-[0.99] w-full sm:w-auto"
                  >
                    {editingOperationId ? "Сохранить изменения" : "Сохранить"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}