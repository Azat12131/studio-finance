import { supabase } from "./supabase"
import React from "react"
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Owner = "Азат" | "Марс"
type PaymentType = "Нал" | "Карта"

type ServiceType =
  | "Запись"
  | "Сведение"
  | "Дистрибуция"
  | "Мастеринг"
  | "Другое"

type AppointmentStatus =
  | "Ожидание"
  | "Подтвердил"
  | "Пришел"
  | "Не пришел"

type ServiceItem = {
  id: number
  type: ServiceType
  hours: number | ""
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

type Appointment = {
  id: number
  date: string
  startTime: string
  endTime: string
  client: string
  phone: string
  owner: Owner
  status: AppointmentStatus
  note: string
  services: ServiceItem[]
  payments: PaymentItem[]
}

type FinancialEntry = {
  id: number
  source: "operation" | "appointment"
  date: string
  client: string
  owner: Owner
  services: ServiceItem[]
  payments: PaymentItem[]
}

type MonthGoals = Record<string, number>
type AppTab = "dashboard" | "schedule" | "operations" | "analytics" | "settings"

const RENT_GOAL = 20000
const DEFAULT_MONTH_GOAL = 50000
const serviceOptions: ServiceType[] = [
  "Запись",
  "Сведение",
  "Дистрибуция",
  "Мастеринг",
  "Другое",
]
const paymentOptions: PaymentType[] = ["Нал", "Карта"]

function makeId() {
  return Date.now() + Math.floor(Math.random() * 100000)
}

function formatMoney(value: number) {
  if (Number.isInteger(value)) return `${value} ₽`
  return `${value.toFixed(1)} ₽`
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

function formatCompactDate(dateString: string) {
  if (!dateString) return "Выбрать дату"
  const date = parseInputDate(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatHumanDate(dateString: string) {
  if (!dateString) return "Выбрать дату"
  const date = parseInputDate(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  })
}

function toMonthKey(dateString: string) {
  if (!dateString) return getInitialMonthKey()
  const date = parseInputDate(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  })
}

function getInitialMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(year, month, 0).getDate()
}

function getPaymentsTotal(entry: { payments: PaymentItem[] }) {
  return entry.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

function getServicesTotal(entry: { services: ServiceItem[] }) {
  return entry.services.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

function getServiceRevenueMap(entries: FinancialEntry[]) {
  const map = new Map<ServiceType, number>()
  entries.forEach((entry) => {
    entry.services.forEach((service) => {
      map.set(service.type, (map.get(service.type) || 0) + Number(service.amount || 0))
    })
  })
  return map
}

function makeServiceRow(type: ServiceType = "Запись"): ServiceItem {
  return {
    id: makeId(),
    type,
    hours: type === "Запись" ? 1 : "",
    amount: type === "Запись" ? 1000 : 0,
  }
}

function makePaymentRow(type: PaymentType = "Нал"): PaymentItem {
  return {
    id: makeId(),
    type,
    amount: 0,
  }
}

function normalizeServiceRow(row: ServiceItem): ServiceItem {
  if (row.type === "Запись") {
    const hours = row.hours === "" ? 0 : Number(row.hours) || 0
    return {
      ...row,
      hours,
      amount: hours * 1000,
    }
  }

  return {
    ...row,
    hours: row.hours === "" ? "" : Number(row.hours) || 0,
    amount: Number(row.amount) || 0,
  }
}

function normalizePaymentRow(row: PaymentItem): PaymentItem {
  return {
    ...row,
    amount: Number(row.amount) || 0,
  }
}

function normalizePayments(rawPayments: unknown): PaymentItem[] {
  if (!Array.isArray(rawPayments)) return []
  return rawPayments.map((item, index) => {
    const raw = item as Partial<PaymentItem>
    const type = (raw.type as PaymentType) || "Нал"
    return {
      id: Number(raw.id) || makeId() + index,
      type,
      amount: Number(raw.amount) || 0,
    }
  })
}

function normalizeServices(rawServices: unknown): ServiceItem[] {
  if (!Array.isArray(rawServices)) return []
  return rawServices.map((item, index) => {
    const raw = item as Partial<ServiceItem>
    const type = (raw.type as ServiceType) || "Запись"
    const hoursRaw = raw.hours === "" ? "" : Number(raw.hours)
    const hours =
      type === "Запись"
        ? Number.isFinite(hoursRaw) && Number(hoursRaw) > 0
          ? Number(hoursRaw)
          : 1
        : ""
    const amount = type === "Запись" ? Number(hours) * 1000 : Number(raw.amount) || 0

    return {
      id: Number(raw.id) || makeId() + index,
      type,
      hours,
      amount,
    }
  })
}

function appointmentToFinancialEntry(appointment: Appointment): FinancialEntry {
  return {
    id: appointment.id,
    source: "appointment",
    date: appointment.date,
    client: appointment.client,
    owner: appointment.owner,
    services: appointment.services,
    payments: appointment.payments,
  }
}

function getStatusPillClass(status: AppointmentStatus) {
  if (status === "Ожидание") return "bg-white/[0.05] text-zinc-200 ring-1 ring-white/10"
  if (status === "Подтвердил")
    return "bg-sky-500/10 text-sky-200 ring-1 ring-sky-400/15"
  if (status === "Пришел")
    return "bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/15"
  return "bg-rose-500/12 text-rose-200 ring-1 ring-rose-400/15"
}

function getOwnerAccent(owner: Owner) {
  return owner === "Азат" ? "from-sky-400 to-indigo-400" : "from-violet-400 to-indigo-400"
}

function getProgressWidth(value: number, total: number) {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20v-12" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5 13.8 5l2.4-.3.8 2.3 2 1.3-1 2 1 2-2 1.3-.8 2.3-2.4-.3L12 20.5l-1.8-1.5-2.4.3-.8-2.3-2-1.3 1-2-1-2 2-1.3.8-2.3 2.4.3L12 3.5Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
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

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
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

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 11.8 19.86 19.86 0 0 1 2.08 3.09 2 2 0 0 1 4.06.92h2a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L7.1 8.91a16 16 0 0 0 8 8l1.54-1.14a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("ui-card animate-in", className)}>
      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  accent = "neutral",
}: {
  label: string
  value: string
  hint?: string
  accent?: "neutral" | "good" | "brand" | "danger"
}) {
  return (
    <ShellCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-zinc-400">{label}</p>
          <p
            className={cn(
              "mt-3 text-[30px] font-semibold tracking-[-0.03em]",
              accent === "good" && "text-emerald-300",
              accent === "brand" && "text-white",
              accent === "neutral" && "text-white",
              accent === "danger" && "text-rose-300"
            )}
          >
            {value}
          </p>
          {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
        </div>
      </div>
    </ShellCard>
  )
}

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-[28px] font-semibold tracking-[-0.035em] text-white sm:text-[32px]">
          {title}
        </h1>
        {subtitle ? <p className="mt-1.5 text-sm text-zinc-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("ui-btn ui-btn-primary", className)}>
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("ui-btn ui-btn-secondary", className)}>
      {children}
    </button>
  )
}

function IconButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("ui-icon-btn", className)}>
      {children}
    </button>
  )
}

function TextInput({
  className = "",
  style,
  placeholder,
  onFocus,
  onBlur,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <input
      {...props}
      placeholder={isFocused ? "" : placeholder}
      onFocus={(e) => {
        setIsFocused(true)
        if (props.type === "number") {
          requestAnimationFrame(() => e.currentTarget.select())
        }
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsFocused(false)
        onBlur?.(e)
      }}
      style={{
        ...style,
      }}
      className={cn("ui-input", className)}
    />
  )
}

function TextArea({
  className = "",
  placeholder,
  onFocus,
  onBlur,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <textarea
      {...props}
      placeholder={isFocused ? "" : placeholder}
      onFocus={(e) => {
        setIsFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsFocused(false)
        onBlur?.(e)
      }}
      className={cn("ui-textarea", className)}
    />
  )
}

function ProgressLine({
  value,
  total,
  colorClassName,
}: {
  value: number
  total: number
  colorClassName: string
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", colorClassName)}
        style={{ width: `${getProgressWidth(value, total)}%` }}
      />
    </div>
  )
}

function MonthTabs({
  months,
  selectedMonth,
  onChange,
}: {
  months: string[]
  selectedMonth: string
  onChange: (month: string) => void
}) {
  return (
    <div className="mb-6">
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2.5">
          {months.map((monthKey) => {
            const active = monthKey === selectedMonth
            return (
              <button
                key={monthKey}
                onClick={() => onChange(monthKey)}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-medium capitalize transition",
                  active
                    ? "bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.14)]"
                    : "bg-white/[0.04] text-zinc-300 ring-1 ring-white/8 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {formatMonthLabel(monthKey)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RecentOperationRow({
  entry,
  onOpen,
}: {
  entry: FinancialEntry
  onOpen: (entry: FinancialEntry) => void
}) {
  const payment = getPaymentsTotal(entry)
  const serviceCount = entry.services.length

  return (
    <button
      onClick={() => onOpen(entry)}
      className="group flex w-full min-w-0 items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition duration-200 hover:-translate-y-[1px] hover:bg-white/[0.045] hover:border-white/12"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[15px] font-medium text-white">{entry.client}</p>
          <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-400 ring-1 ring-white/8">
            {entry.owner}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {formatDisplayDate(entry.date)} · {serviceCount} усл.
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[16px] font-semibold text-white">{formatMoney(payment)}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {entry.source === "appointment" ? "Запись" : "Операция"}
        </p>
      </div>
    </button>
  )
}

function CompactField({
  value,
  placeholder,
  icon,
  onClick,
  className = "",
}: {
  value: string
  placeholder: string
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const Comp = onClick ? "button" : "div"

  return (
    <Comp
      {...(onClick ? { onClick, type: "button" as const } : {})}
      className={cn("ui-input flex h-[56px] items-center gap-3 px-4 text-left", className)}
    >
      {icon ? <div className="shrink-0 text-zinc-400">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[15px]", value ? "text-white" : "text-zinc-500")}>
          {value || placeholder}
        </div>
      </div>
    </Comp>
  )
}

function ModalDateField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <CompactField
        value={formatHumanDate(value)}
        placeholder="Дата"
        icon={<CalendarIcon />}
        onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
      />
    </>
  )
}

function ModalTimeField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <CompactField
        value={value || "Время"}
        placeholder="Время"
        icon={<ClockIcon />}
        onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
      />
    </>
  )
}

function PickerSheet<T extends string>({
  open,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  open: boolean
  title: string
  options: readonly T[]
  value: T
  onSelect: (value: T) => void
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[560px] rounded-t-[28px] border border-white/10 bg-[#0f1117] px-4 pb-6 pt-4 shadow-[0_-20px_80px_rgba(0,0,0,0.48)] animate-sheet-in">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/14" />
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold text-white">{title}</p>
          <IconButton onClick={onClose} className="h-9 w-9 rounded-full">
            <CloseIcon />
          </IconButton>
        </div>

        <div className="space-y-2">
          {options.map((option) => {
            const active = option === value
            return (
              <button
                key={option}
                onClick={() => {
                  onSelect(option)
                  onClose()
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[18px] px-4 py-4 text-left transition",
                  active
                    ? "bg-white text-black"
                    : "bg-white/[0.04] text-zinc-200 ring-1 ring-white/8 hover:bg-white/[0.06]"
                )}
              >
                <span>{option}</span>
                {active ? <span className="text-sm text-black/60">Выбрано</span> : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NativeDateButton({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <CompactField
        value={formatCompactDate(value)}
        placeholder="Выбрать дату"
        onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
        icon={<CalendarIcon />}
      />
    </>
  )
}

function SidebarNav({
  activeTab,
  onChange,
  onAdd,
  onCreateMonth,
  logo,
}: {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
  onAdd: () => void
  onCreateMonth: () => void
  logo: string
}) {
  const items: Array<{ key: AppTab; label: string; icon: React.ReactNode }> = [
    { key: "dashboard", label: "Главная", icon: <HomeIcon /> },
    { key: "schedule", label: "График", icon: <CalendarIcon /> },
    { key: "operations", label: "Финансы", icon: <ReceiptIcon /> },
    { key: "analytics", label: "Аналитика", icon: <ChartIcon /> },
    { key: "settings", label: "Настройки", icon: <SettingsIcon /> },
  ]

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-white/6 bg-[#0b0d12]/90 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/8">
          <img src={logo} alt="logo" className="h-6 w-auto object-contain opacity-95" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-white">Studio CRM</p>
          <p className="text-xs text-zinc-500">Premium workspace</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => {
          const active = item.key === activeTab
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium transition",
                active
                  ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-8 space-y-3">
        <PrimaryButton onClick={onAdd} className="w-full justify-center">
          <PlusIcon />
          Новая запись
        </PrimaryButton>

        <SecondaryButton onClick={onCreateMonth} className="w-full justify-center">
          <PlusIcon />
          Новый месяц
        </SecondaryButton>
      </div>

      <div className="mt-auto rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Система</p>
        <p className="mt-2 text-sm text-zinc-300">
          Чистый интерфейс, быстрый доступ и фокус на ежедневной работе.
        </p>
      </div>
    </aside>
  )
}

function BottomNav({
  activeTab,
  onChange,
  hidden = false,
}: {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
  hidden?: boolean
}) {
  if (hidden) return null

  const itemClass = (tab: AppTab) =>
    cn(
      "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] transition",
      activeTab === tab ? "bg-white text-black" : "text-zinc-400"
    )

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-[700] flex justify-center lg:hidden">
      <div className="pointer-events-auto mx-4 flex w-[calc(100%-32px)] max-w-[480px] items-center gap-2 rounded-[26px] border border-white/10 bg-[#0d0f15]/86 p-2 shadow-[0_20px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <button className={itemClass("dashboard")} onClick={() => onChange("dashboard")}>
          <HomeIcon />
          <span>Главная</span>
        </button>

        <button className={itemClass("schedule")} onClick={() => onChange("schedule")}>
          <CalendarIcon />
          <span>График</span>
        </button>

        <button className={itemClass("operations")} onClick={() => onChange("operations")}>
          <ReceiptIcon />
          <span>Финансы</span>
        </button>

        <button className={itemClass("analytics")} onClick={() => onChange("analytics")}>
          <ChartIcon />
          <span>График</span>
        </button>

        <button className={itemClass("settings")} onClick={() => onChange("settings")}>
          <SettingsIcon />
          <span>Ещё</span>
        </button>
      </div>
    </div>
  )
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-1">
      <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-[48px] rounded-[14px] px-3 text-[14px] font-medium transition",
                active ? "bg-white text-black" : "text-zinc-300 hover:bg-white/[0.05]"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[13px] font-medium text-zinc-400">{children}</p>
}

export default function App() {
  const initialMonthKey = React.useMemo(() => getInitialMonthKey(), [])

  const [legacyOperations, setLegacyOperations] = React.useState<Operation[]>([])
  const [appointments, setAppointments] = React.useState<Appointment[]>([])

  const [monthGoals, setMonthGoals] = React.useState<MonthGoals>({
    [initialMonthKey]: DEFAULT_MONTH_GOAL,
  })
  const [months, setMonths] = React.useState<string[]>([initialMonthKey])
  const [selectedMonth, setSelectedMonth] = React.useState(initialMonthKey)

  const [activeTab, setActiveTab] = React.useState<AppTab>("dashboard")

  const [selectedDate, setSelectedDate] = React.useState(formatInputDate(new Date()))
  const [showAppointmentModal, setShowAppointmentModal] = React.useState(false)
  const [editingAppointmentId, setEditingAppointmentId] = React.useState<number | null>(null)

  const [appointmentClient, setAppointmentClient] = React.useState("")
  const [appointmentPhone, setAppointmentPhone] = React.useState("")
  const [appointmentOwner, setAppointmentOwner] = React.useState<Owner>("Азат")
  const [appointmentStatus, setAppointmentStatus] =
    React.useState<AppointmentStatus>("Ожидание")
  const [appointmentDate, setAppointmentDate] = React.useState(formatInputDate(new Date()))
  const [appointmentStartTime, setAppointmentStartTime] = React.useState("14:00")
  const [appointmentEndTime, setAppointmentEndTime] = React.useState("15:00")
  const [appointmentNote, setAppointmentNote] = React.useState("")
  const [appointmentServices, setAppointmentServices] = React.useState<ServiceItem[]>([
    makeServiceRow(),
  ])
  const [appointmentPayments, setAppointmentPayments] = React.useState<PaymentItem[]>([
    makePaymentRow("Нал"),
  ])

  const [servicePickerRowId, setServicePickerRowId] = React.useState<number | null>(null)
  const [paymentPickerRowId, setPaymentPickerRowId] = React.useState<number | null>(null)

  const resetAppointmentForm = React.useCallback(() => {
    const today = formatInputDate(new Date())
    setAppointmentClient("")
    setAppointmentPhone("")
    setAppointmentOwner("Азат")
    setAppointmentStatus("Ожидание")
    setAppointmentDate(selectedDate || today)
    setAppointmentStartTime("14:00")
    setAppointmentEndTime("15:00")
    setAppointmentNote("")
    setAppointmentServices([makeServiceRow()])
    setAppointmentPayments([makePaymentRow("Нал")])
    setEditingAppointmentId(null)
  }, [selectedDate])

  const loadData = React.useCallback(async () => {
    const [
      { data: operationsData, error: operationsError },
      { data: goalsData, error: goalsError },
      { data: appointmentsData, error: appointmentsError },
    ] = await Promise.all([
      supabase.from("operations").select("*").order("date", { ascending: false }),
      supabase.from("month_goals").select("*"),
      supabase.from("appointments").select("*").order("date", { ascending: false }),
    ])

    if (operationsError) {
      console.error("Error loading operations", operationsError)
      return
    }

    if (goalsError) {
      console.error("Error loading goals", goalsError)
      return
    }

    if (appointmentsError) {
      console.error("Error loading appointments", appointmentsError)
      return
    }

    const mappedOperations: Operation[] = (operationsData || []).map((item) => ({
      id: Number(item.id),
      date: String(item.date),
      client: String(item.client || "Без клиента"),
      owner: (item.owner as Owner) || "Азат",
      services: normalizeServices(item.services),
      payments: normalizePayments(item.payments),
    }))

    const mappedAppointments: Appointment[] = (appointmentsData || []).map((item) => ({
      id: Number(item.id),
      date: String(item.date),
      startTime: String(item.start_time || "14:00"),
      endTime: String(item.end_time || "15:00"),
      client: String(item.client || "Без клиента"),
      phone: String(item.phone || ""),
      owner: (item.owner as Owner) || "Азат",
      status: (item.status as AppointmentStatus) || "Ожидание",
      note: String(item.comment || ""),
      services: normalizeServices(item.services),
      payments: normalizePayments(item.payments),
    }))

    const goalMap: Record<string, number> = {}
    const monthSet = new Set<string>([initialMonthKey])

    ;(goalsData || []).forEach((goalRow) => {
      goalMap[String(goalRow.month_key)] = Number(goalRow.goal) || DEFAULT_MONTH_GOAL
      monthSet.add(String(goalRow.month_key))
    })

    mappedOperations.forEach((operation) => {
      monthSet.add(toMonthKey(operation.date))
    })

    mappedAppointments.forEach((appointment) => {
      monthSet.add(toMonthKey(appointment.date))
    })

    const nextMonths = Array.from(monthSet).sort().reverse()

    setLegacyOperations(mappedOperations)
    setAppointments(mappedAppointments)
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
      .channel("all-realtime")
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => void loadData()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadData])

  const normalizedMonths = React.useMemo(() => {
    const all = new Set<string>(months)
    legacyOperations.forEach((operation) => all.add(toMonthKey(operation.date)))
    appointments.forEach((appointment) => all.add(toMonthKey(appointment.date)))
    all.add(initialMonthKey)
    return Array.from(all).sort().reverse()
  }, [appointments, initialMonthKey, legacyOperations, months])

  const financialEntries = React.useMemo<FinancialEntry[]>(() => {
    const legacyEntries: FinancialEntry[] = legacyOperations.map((operation) => ({
      id: operation.id,
      source: "operation",
      date: operation.date,
      client: operation.client,
      owner: operation.owner,
      services: operation.services,
      payments: operation.payments,
    }))

    const appointmentEntries = appointments.map(appointmentToFinancialEntry)

    return [...legacyEntries, ...appointmentEntries].sort(
      (a, b) => parseInputDate(b.date).getTime() - parseInputDate(a.date).getTime()
    )
  }, [appointments, legacyOperations])

  const selectedMonthEntries = React.useMemo(() => {
    return financialEntries.filter((entry) => toMonthKey(entry.date) === selectedMonth)
  }, [financialEntries, selectedMonth])

  const monthIncome = React.useMemo(() => {
    return selectedMonthEntries.reduce((sum, entry) => sum + getPaymentsTotal(entry), 0)
  }, [selectedMonthEntries])

  const monthGoal = monthGoals[selectedMonth] ?? DEFAULT_MONTH_GOAL
  const leftToRent = Math.max(RENT_GOAL - monthIncome, 0)
  const leftToMonthGoal = Math.max(monthGoal - monthIncome, 0)
  const profitAfterRent = monthIncome - RENT_GOAL

  const azatIncome = React.useMemo(() => {
    return selectedMonthEntries
      .filter((entry) => entry.owner === "Азат")
      .reduce((sum, entry) => sum + getPaymentsTotal(entry), 0)
  }, [selectedMonthEntries])

  const marsIncome = React.useMemo(() => {
    return selectedMonthEntries
      .filter((entry) => entry.owner === "Марс")
      .reduce((sum, entry) => sum + getPaymentsTotal(entry), 0)
  }, [selectedMonthEntries])

  const serviceRevenueRows = React.useMemo(() => {
    return Array.from(getServiceRevenueMap(selectedMonthEntries).entries()).sort(
      (a, b) => b[1] - a[1]
    )
  }, [selectedMonthEntries])

  const topClient = React.useMemo(() => {
    const map = new Map<string, number>()
    selectedMonthEntries.forEach((entry) => {
      map.set(entry.client, (map.get(entry.client) || 0) + getPaymentsTotal(entry))
    })
    const rows = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    return rows[0] || null
  }, [selectedMonthEntries])

  const dailyStats = React.useMemo(() => {
    const daysCount = getDaysInMonth(selectedMonth)
    const [year, month] = selectedMonth.split("-").map(Number)

    const values = Array.from({ length: daysCount }, (_, index) => ({
      day: index + 1,
      amount: 0,
      dateKey: formatInputDate(new Date(year, month - 1, index + 1)),
    }))

    selectedMonthEntries.forEach((entry) => {
      const day = parseInputDate(entry.date).getDate()
      const index = day - 1
      if (values[index]) values[index].amount += getPaymentsTotal(entry)
    })

    const positiveDays = values.filter((item) => item.amount > 0)
    const positiveAverage =
      positiveDays.length > 0
        ? positiveDays.reduce((sum, item) => sum + item.amount, 0) / positiveDays.length
        : 0

    const colors = values.map((item) => {
      if (item.amount === 0) return "rgba(255,255,255,0.12)"
      if (positiveAverage > 0 && item.amount < positiveAverage * 0.6) {
        return "rgba(129,140,248,0.72)"
      }
      return "rgba(56,189,248,0.88)"
    })

    const bestDays = [...values]
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)

    const weakDays = values.filter((item) => item.amount === 0).length

    return { values, colors, bestDays, weakDays }
  }, [selectedMonth, selectedMonthEntries])

  const chartData = React.useMemo(() => {
    return {
      labels: dailyStats.values.map((item) => String(item.day)),
      datasets: [
        {
          label: "Выручка по дням",
          data: dailyStats.values.map((item) => item.amount),
          backgroundColor: dailyStats.colors,
          borderRadius: 999,
          barThickness: 12,
          borderSkipped: false as const,
        },
      ],
    }
  }, [dailyStats])

  const chartOptions = React.useMemo<ChartOptions<"bar">>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(10,12,16,0.96)",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          titleColor: "#fff",
          bodyColor: "#d4d4d8",
          displayColors: false,
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
            color: "#71717a",
            font: { size: 11 },
          },
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: "#71717a",
            callback(value) {
              return formatMoney(Number(value))
            },
            font: { size: 11 },
          },
          grid: {
            color: "rgba(255,255,255,0.05)",
          },
          border: {
            display: false,
          },
        },
      },
    }
  }, [])

  const selectedDateAppointments = React.useMemo(() => {
    return [...appointments]
      .filter((appointment) => appointment.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [appointments, selectedDate])

  const currentAppointmentServicesTotal = React.useMemo(() => {
    return appointmentServices.reduce((sum, row) => sum + normalizeServiceRow(row).amount, 0)
  }, [appointmentServices])

  const currentAppointmentPaymentsTotal = React.useMemo(() => {
    return appointmentPayments.reduce((sum, row) => sum + normalizePaymentRow(row).amount, 0)
  }, [appointmentPayments])

  const remainingToPay = Math.max(
    currentAppointmentServicesTotal - currentAppointmentPaymentsTotal,
    0
  )

  const openCreateAppointmentModal = React.useCallback(() => {
    resetAppointmentForm()
    setShowAppointmentModal(true)
  }, [resetAppointmentForm])

  const openEditAppointmentModal = React.useCallback((appointment: Appointment) => {
    setEditingAppointmentId(appointment.id)
    setAppointmentClient(appointment.client)
    setAppointmentPhone(appointment.phone)
    setAppointmentOwner(appointment.owner)
    setAppointmentStatus(appointment.status)
    setAppointmentDate(appointment.date)
    setAppointmentStartTime(appointment.startTime)
    setAppointmentEndTime(appointment.endTime)
    setAppointmentNote(appointment.note)
    setAppointmentServices(
      appointment.services.length > 0
        ? appointment.services.map((service) => ({
            ...service,
            id: service.id || makeId(),
            hours:
              service.type === "Запись"
                ? Number(service.hours) > 0
                  ? Number(service.hours)
                  : ""
                : "",
          }))
        : [makeServiceRow()]
    )
    setAppointmentPayments(
      appointment.payments.length > 0
        ? appointment.payments.map((payment) => ({
            ...payment,
            id: payment.id || makeId(),
            amount: payment.amount,
          }))
        : [makePaymentRow("Нал")]
    )
    setShowAppointmentModal(true)
  }, [])

  const openFinancialEntry = React.useCallback(
    (entry: FinancialEntry) => {
      if (entry.source === "appointment") {
        const found = appointments.find((item) => item.id === entry.id)
        if (found) openEditAppointmentModal(found)
      }
    },
    [appointments, openEditAppointmentModal]
  )

  const addAppointmentServiceRow = React.useCallback(() => {
    setAppointmentServices((prev) => [...prev, makeServiceRow()])
  }, [])

  const updateAppointmentServiceRow = React.useCallback(
    (id: number, patch: Partial<ServiceItem>) => {
      setAppointmentServices((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row

          const next = { ...row, ...patch }

          if (next.type === "Запись") {
            const hoursValue = next.hours === "" ? "" : Number(next.hours) || 0
            return {
              ...next,
              hours: hoursValue,
              amount: hoursValue === "" ? 0 : Number(hoursValue) * 1000,
            }
          }

          return {
            ...next,
            hours: "",
            amount: Number(next.amount) || 0,
          }
        })
      )
    },
    []
  )

  const removeAppointmentServiceRow = React.useCallback((id: number) => {
    setAppointmentServices((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const addAppointmentPaymentRow = React.useCallback(
    (type: PaymentType) => {
      setAppointmentPayments((prev) => [
        ...prev,
        {
          id: makeId(),
          type,
          amount: Math.max(
            currentAppointmentServicesTotal -
              prev.reduce((sum, row) => sum + normalizePaymentRow(row).amount, 0),
            0
          ),
        },
      ])
    },
    [currentAppointmentServicesTotal]
  )

  const updateAppointmentPaymentRow = React.useCallback(
    (id: number, patch: Partial<PaymentItem>) => {
      setAppointmentPayments((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row
          return normalizePaymentRow({ ...row, ...patch })
        })
      )
    },
    []
  )

  const removeAppointmentPaymentRow = React.useCallback((id: number) => {
    setAppointmentPayments((prev) => prev.filter((row) => row.id !== id))
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

  const saveAppointment = React.useCallback(async () => {
    if (!appointmentDate) {
      alert("Выбери дату.")
      return
    }

    if (!appointmentStartTime || !appointmentEndTime) {
      alert("Укажи время начала и конца.")
      return
    }

    if (appointmentServices.length === 0) {
      alert("Добавь хотя бы одну услугу.")
      return
    }

    if (appointmentPayments.length === 0) {
      alert("Добавь хотя бы одну оплату.")
      return
    }

    const cleanedServices = appointmentServices.map(normalizeServiceRow)
    const cleanedPayments = appointmentPayments.map(normalizePaymentRow)

    if (cleanedServices.some((row) => row.amount <= 0)) {
      alert("Во всех услугах должна быть корректная сумма.")
      return
    }

    if (cleanedPayments.some((row) => row.amount < 0)) {
      alert("Во всех оплатах должна быть корректная сумма.")
      return
    }

    const monthKey = toMonthKey(appointmentDate)

    try {
      await ensureMonthExists(monthKey)
    } catch {
      alert("Не удалось сохранить месяц")
      return
    }

    const payload = {
      date: appointmentDate,
      start_time: appointmentStartTime,
      end_time: appointmentEndTime,
      client: appointmentClient.trim() || "Без клиента",
      phone: appointmentPhone.trim(),
      owner: appointmentOwner,
      status: appointmentStatus,
      comment: appointmentNote.trim(),
      services: cleanedServices,
      payments: cleanedPayments,
    }

    if (editingAppointmentId) {
      const { data, error } = await supabase
        .from("appointments")
        .update(payload)
        .eq("id", editingAppointmentId)
        .select()
        .single()

      if (error) {
        console.error("Error updating appointment", error)
        alert("Не удалось обновить запись")
        return
      }

      const updatedAppointment: Appointment = {
        id: Number(data.id),
        date: String(data.date),
        startTime: String(data.start_time),
        endTime: String(data.end_time),
        client: String(data.client),
        phone: String(data.phone || ""),
        owner: data.owner as Owner,
        status: data.status as AppointmentStatus,
        note: String(data.comment || ""),
        services: normalizeServices(data.services),
        payments: normalizePayments(data.payments),
      }

      setAppointments((prev) =>
        prev.map((item) => (item.id === editingAppointmentId ? updatedAppointment : item))
      )
    } else {
      const { data, error } = await supabase
        .from("appointments")
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error("Error creating appointment", error)
        alert(`Не удалось сохранить запись: ${error.message}`)
        return
      }

      const newAppointment: Appointment = {
        id: Number(data.id),
        date: String(data.date),
        startTime: String(data.start_time),
        endTime: String(data.end_time),
        client: String(data.client),
        phone: String(data.phone || ""),
        owner: data.owner as Owner,
        status: data.status as AppointmentStatus,
        note: String(data.comment || ""),
        services: normalizeServices(data.services),
        payments: normalizePayments(data.payments),
      }

      setAppointments((prev) => [...prev, newAppointment])
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
    setSelectedDate(appointmentDate)
    setShowAppointmentModal(false)
    resetAppointmentForm()
  }, [
    appointmentClient,
    appointmentDate,
    appointmentEndTime,
    appointmentNote,
    appointmentOwner,
    appointmentPayments,
    appointmentPhone,
    appointmentServices,
    appointmentStartTime,
    appointmentStatus,
    editingAppointmentId,
    ensureMonthExists,
    resetAppointmentForm,
  ])

  const deleteAppointment = React.useCallback(
    async (id: number) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id)

      if (error) {
        console.error("Error deleting appointment", error)
        alert("Не удалось удалить запись")
        return
      }

      setAppointments((prev) => prev.filter((item) => item.id !== id))
      setShowAppointmentModal(false)
      resetAppointmentForm()
    },
    [resetAppointmentForm]
  )

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

  const deleteSelectedMonth = React.useCallback(async () => {
    if (normalizedMonths.length <= 1) {
      alert("Нельзя удалить последний месяц.")
      return
    }

    const confirmed = window.confirm(
      `Удалить месяц ${formatMonthLabel(selectedMonth)} вместе со всеми записями и операциями?`
    )

    if (!confirmed) return

    const { error: deleteOperationsError } = await supabase
      .from("operations")
      .delete()
      .gte("date", `${selectedMonth}-01`)
      .lte("date", `${selectedMonth}-31`)

    if (deleteOperationsError) {
      console.error("Error deleting operations by month", deleteOperationsError)
      alert("Не удалось удалить операции месяца")
      return
    }

    const { error: deleteAppointmentsError } = await supabase
      .from("appointments")
      .delete()
      .gte("date", `${selectedMonth}-01`)
      .lte("date", `${selectedMonth}-31`)

    if (deleteAppointmentsError) {
      console.error("Error deleting appointments by month", deleteAppointmentsError)
      alert("Не удалось удалить записи месяца")
      return
    }

    const { error: deleteGoalError } = await supabase
      .from("month_goals")
      .delete()
      .eq("month_key", selectedMonth)

    if (deleteGoalError) {
      console.error("Error deleting month goal", deleteGoalError)
      alert("Не удалось удалить месяц")
      return
    }

    const nextMonths = normalizedMonths.filter((month) => month !== selectedMonth)

    setLegacyOperations((prev) =>
      prev.filter((operation) => toMonthKey(operation.date) !== selectedMonth)
    )
    setAppointments((prev) =>
      prev.filter((appointment) => toMonthKey(appointment.date) !== selectedMonth)
    )
    setMonths(nextMonths)
    setMonthGoals((prev) => {
      const copy = { ...prev }
      delete copy[selectedMonth]
      return copy
    })
    setSelectedMonth(nextMonths[0] || getInitialMonthKey())
  }, [normalizedMonths, selectedMonth])

  const shiftSelectedDate = React.useCallback(
    (direction: -1 | 1) => {
      const current = parseInputDate(selectedDate)
      current.setDate(current.getDate() + direction)
      setSelectedDate(formatInputDate(current))
    },
    [selectedDate]
  )

  const activeServicePickerValue =
    appointmentServices.find((row) => row.id === servicePickerRowId)?.type ?? "Запись"
  const activePaymentPickerValue =
    appointmentPayments.find((row) => row.id === paymentPickerRowId)?.type ?? "Нал"

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.10),transparent_28%),linear-gradient(180deg,#07090d_0%,#090b10_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.028] [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9)_0.6px,transparent_0.8px),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.6)_0.6px,transparent_0.8px),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.75)_0.6px,transparent_0.8px)] [background-size:170px_170px,210px_210px,190px_190px]" />

      <div className="flex min-h-screen w-full">
        <SidebarNav
          activeTab={activeTab}
          onChange={setActiveTab}
          onAdd={openCreateAppointmentModal}
          onCreateMonth={createNewMonth}
          logo={logoWhite}
        />

        <main className="min-w-0 flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
          {activeTab === "dashboard" && (
            <>
              <SectionTitle
                title="Главная"
                subtitle="Финансовый срез, прогресс и ключевые показатели месяца"
                action={
                  <PrimaryButton onClick={openCreateAppointmentModal} className="hidden sm:inline-flex">
                    <PlusIcon />
                    Новая запись
                  </PrimaryButton>
                }
              />

              <MonthTabs
                months={normalizedMonths}
                selectedMonth={selectedMonth}
                onChange={setSelectedMonth}
              />

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <ShellCard className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-zinc-400">Месячный прогресс</p>
                      <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white sm:text-[28px]">
                        {formatMoney(monthIncome)}
                      </h2>
                    </div>
                    <div className="rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 ring-1 ring-white/8">
                      {formatMonthLabel(selectedMonth)}
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-400">Цель месяца</span>
                        <span className="text-sm font-medium text-white">{formatMoney(monthGoal)}</span>
                      </div>
                      <ProgressLine
                        value={monthIncome}
                        total={monthGoal}
                        colorClassName="from-sky-400 to-indigo-400"
                      />
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
                        <span>Собрано</span>
                        <span>{formatMoney(monthIncome)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-400">Аренда</span>
                        <span className="text-sm font-medium text-white">{formatMoney(RENT_GOAL)}</span>
                      </div>
                      <ProgressLine
                        value={monthIncome}
                        total={RENT_GOAL}
                        colorClassName="from-emerald-400 to-teal-400"
                      />
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
                        <span>Осталось до аренды</span>
                        <span>{formatMoney(leftToRent)}</span>
                      </div>
                    </div>
                  </div>
                </ShellCard>

                <ShellCard className="p-5 sm:p-6">
                  <p className="text-sm text-zinc-400">Кто сколько заработал</p>
                  <div className="mt-5 space-y-4">
                    {[
                      { owner: "Азат" as Owner, value: azatIncome },
                      { owner: "Марс" as Owner, value: marsIncome },
                    ].map((item) => (
                      <div
                        key={item.owner}
                        className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[15px] text-zinc-300">{item.owner}</span>
                          <span className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                            {formatMoney(item.value)}
                          </span>
                        </div>
                        <div className="mt-3">
                          <ProgressLine
                            value={item.value}
                            total={Math.max(monthIncome, 1)}
                            colorClassName={getOwnerAccent(item.owner)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ShellCard>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Осталось до цели"
                  value={formatMoney(leftToMonthGoal)}
                  hint="Сколько не хватает до плана"
                  accent="brand"
                />
                <StatCard
                  label="Чистая прибыль"
                  value={formatMoney(profitAfterRent)}
                  hint="Доход минус аренда"
                  accent={profitAfterRent >= 0 ? "good" : "danger"}
                />
                <StatCard
                  label="Лучший клиент"
                  value={topClient ? topClient[0] : "Нет данных"}
                  hint={topClient ? formatMoney(topClient[1]) : "Пока нет лидера"}
                />
                <ShellCard className="p-5">
                  <p className="text-[13px] font-medium text-zinc-400">Топ услуг</p>
                  <div className="mt-4 space-y-3">
                    {serviceRevenueRows.length > 0 ? (
                      serviceRevenueRows.slice(0, 4).map(([service, amount]) => (
                        <div key={service} className="flex items-center justify-between gap-4">
                          <span className="text-sm text-zinc-300">{service}</span>
                          <span className="text-sm font-medium text-white">{formatMoney(amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500">Пока нет данных</p>
                    )}
                  </div>
                </ShellCard>
              </div>
            </>
          )}

          {activeTab === "schedule" && (
            <>
              <SectionTitle
                title="График"
                subtitle="Ежедневная запись клиентов"
                action={
                  <PrimaryButton onClick={openCreateAppointmentModal}>
                    <PlusIcon />
                    Запись
                  </PrimaryButton>
                }
              />

              <ShellCard className="mb-4 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <IconButton onClick={() => shiftSelectedDate(-1)}>
                    <ChevronLeftIcon />
                  </IconButton>

                  <div className="min-w-0 flex-1">
                    <NativeDateButton value={selectedDate} onChange={setSelectedDate} />
                  </div>

                  <IconButton onClick={() => shiftSelectedDate(1)}>
                    <ChevronRightIcon />
                  </IconButton>
                </div>
              </ShellCard>

              <div className="space-y-3">
                {selectedDateAppointments.map((a) => {
                  const total = getServicesTotal(a)
                  const paid = getPaymentsTotal(a)

                  return (
                    <button
                      key={a.id}
                      onClick={() => openEditAppointmentModal(a)}
                      className="group block w-full rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-left transition duration-200 hover:-translate-y-[1px] hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-white/8">
                              {a.startTime} — {a.endTime}
                            </span>
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                                getStatusPillClass(a.status)
                              )}
                            >
                              {a.status === "Пришел"
                                ? "Пришёл"
                                : a.status === "Не пришел"
                                  ? "Не пришёл"
                                  : a.status}
                            </span>
                          </div>

                          <p className="mt-3 truncate text-[18px] font-semibold tracking-[-0.02em] text-white">
                            {a.client}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                            <span>{a.owner}</span>
                            {a.phone ? <span>· {a.phone}</span> : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[18px] font-semibold text-white">{formatMoney(paid)}</p>
                          <p className="mt-1 text-xs text-zinc-500">из {formatMoney(total)}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {selectedDateAppointments.length === 0 && (
                  <ShellCard className="p-6">
                    <p className="text-[16px] font-medium text-white">На эту дату записей нет</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Добавь новую запись, чтобы заполнить расписание.
                    </p>
                  </ShellCard>
                )}
              </div>
            </>
          )}

          {activeTab === "operations" && (
            <>
              <SectionTitle
                title="Финансы"
                subtitle="Все движения по выбранному месяцу"
              />

              <MonthTabs
                months={normalizedMonths}
                selectedMonth={selectedMonth}
                onChange={setSelectedMonth}
              />

              <div className="space-y-3">
                {selectedMonthEntries.length > 0 ? (
                  selectedMonthEntries.map((entry) => (
                    <RecentOperationRow
                      key={entry.source === "appointment" ? `a-${entry.id}` : `o-${entry.id}`}
                      entry={entry}
                      onOpen={openFinancialEntry}
                    />
                  ))
                ) : (
                  <ShellCard className="p-6">
                    <p className="text-[16px] font-medium text-white">Пока пусто</p>
                    <p className="mt-1 text-sm text-zinc-500">За этот месяц данных пока нет.</p>
                  </ShellCard>
                )}
              </div>
            </>
          )}

          {activeTab === "analytics" && (
            <>
              <SectionTitle
                title="Аналитика"
                subtitle="Ритм месяца и сильные дни"
              />

              <MonthTabs
                months={normalizedMonths}
                selectedMonth={selectedMonth}
                onChange={setSelectedMonth}
              />

              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <ShellCard className="h-[340px] p-5 sm:p-6">
                  <div className="mb-4">
                    <p className="text-sm text-zinc-400">Выручка по дням</p>
                    <p className="mt-1 text-[22px] font-semibold tracking-[-0.025em] text-white">
                      {formatMonthLabel(selectedMonth)}
                    </p>
                  </div>
                  <div className="h-[250px]">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </ShellCard>

                <ShellCard className="p-5 sm:p-6">
                  <p className="text-sm text-zinc-400">Лучшие дни месяца</p>
                  <div className="mt-4 space-y-3">
                    {dailyStats.bestDays.length > 0 ? (
                      dailyStats.bestDays.map((day, index) => (
                        <div
                          key={day.dateKey}
                          className="flex items-center justify-between gap-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-zinc-500">#{index + 1}</p>
                            <p className="mt-1 text-sm font-medium text-white">
                              {formatDisplayDate(day.dateKey)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-white">
                            {formatMoney(day.amount)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500">Пока нет успешных дней</p>
                    )}
                  </div>

                  <div className="mt-6 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-zinc-400">Пустых дней</span>
                      <span className="text-sm font-medium text-white">{dailyStats.weakDays}</span>
                    </div>
                  </div>
                </ShellCard>
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <SectionTitle title="Настройки" subtitle="Цели и управление месяцами" />

              <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                <ShellCard className="p-5 sm:p-6">
                  <FormLabel>Цель месяца</FormLabel>
                  <TextInput
                    type="number"
                    value={monthGoal}
                    onChange={async (e) => {
                      const numeric = Number(e.target.value)
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
                    }}
                  />
                  <p className="mt-3 text-sm text-zinc-500">
                    Актуальная цель для {formatMonthLabel(selectedMonth)}.
                  </p>
                </ShellCard>

                <ShellCard className="p-5 sm:p-6 xl:w-[280px]">
                  <p className="text-sm text-zinc-400">Опасная зона</p>
                  <p className="mt-2 text-[18px] font-semibold text-white">Удаление месяца</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Будут удалены операции, записи и цель выбранного месяца.
                  </p>
                  <button
                    onClick={deleteSelectedMonth}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-[14px] border border-rose-400/18 bg-rose-500/10 px-4 text-sm font-medium text-rose-200 transition hover:bg-rose-500/14"
                  >
                    Удалить месяц
                  </button>
                </ShellCard>
              </div>
            </>
          )}
        </main>

        <BottomNav
          activeTab={activeTab}
          onChange={setActiveTab}
          hidden={showAppointmentModal}
        />

        {showAppointmentModal && (
          <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setShowAppointmentModal(false)} />

            <div className="absolute bottom-0 left-0 right-0 mx-auto flex h-[min(92vh,980px)] w-full max-w-[760px] flex-col rounded-t-[32px] border border-white/10 bg-[#0e1117] shadow-[0_-24px_90px_rgba(0,0,0,0.58)] animate-sheet-in">
              <div className="px-4 pt-4 sm:px-6">
                <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/14" />
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {editingAppointmentId ? "Редактирование" : "Новая запись"}
                    </p>
                    <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-white">
                      {editingAppointmentId ? "Карточка записи" : "Создание записи"}
                    </h2>
                  </div>

                  <IconButton onClick={() => setShowAppointmentModal(false)}>
                    <CloseIcon />
                  </IconButton>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
                <div className="space-y-4 pb-4">
                  <ShellCard className="p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FormLabel>Клиент</FormLabel>
                        <div className="relative">
                          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <UserIcon />
                          </div>
                          <TextInput
                            placeholder="Имя клиента"
                            value={appointmentClient}
                            onChange={(e) => setAppointmentClient(e.target.value)}
                            className="pl-12"
                          />
                        </div>
                      </div>

                      <div>
                        <FormLabel>Телефон</FormLabel>
                        <div className="relative">
                          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <PhoneIcon />
                          </div>
                          <TextInput
                            type="tel"
                            placeholder="Телефон"
                            value={appointmentPhone}
                            onChange={(e) => setAppointmentPhone(e.target.value)}
                            className="pl-12"
                          />
                        </div>
                      </div>
                    </div>
                  </ShellCard>

                  <ShellCard className="p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FormLabel>Дата</FormLabel>
                        <ModalDateField value={appointmentDate} onChange={setAppointmentDate} />
                      </div>

                      <div>
                        <FormLabel>Исполнитель</FormLabel>
                        <SegmentedControl
                          options={[
                            { value: "Азат", label: "Азат" },
                            { value: "Марс", label: "Марс" },
                          ]}
                          value={appointmentOwner}
                          onChange={setAppointmentOwner}
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <FormLabel>Начало</FormLabel>
                        <ModalTimeField
                          value={appointmentStartTime}
                          onChange={setAppointmentStartTime}
                        />
                      </div>

                      <div>
                        <FormLabel>Конец</FormLabel>
                        <ModalTimeField
                          value={appointmentEndTime}
                          onChange={setAppointmentEndTime}
                        />
                      </div>
                    </div>
                  </ShellCard>

                  <ShellCard className="p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-semibold text-white">Услуги</p>
                        <p className="text-sm text-zinc-500">Состав и стоимость записи</p>
                      </div>
                      <IconButton onClick={addAppointmentServiceRow}>
                        <PlusIcon />
                      </IconButton>
                    </div>

                    <div className="space-y-3">
                      {appointmentServices.map((service) => (
                        <div
                          key={service.id}
                          className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3"
                        >
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_44px]">
                            <button
                              type="button"
                              onClick={() => setServicePickerRowId(service.id)}
                              className="ui-input flex h-[52px] min-w-0 items-center justify-between px-4"
                            >
                              <span className="truncate text-[15px] text-white">{service.type}</span>
                              <span className="ml-3 shrink-0 text-zinc-500">↕</span>
                            </button>

                            {service.type === "Запись" ? (
                              <TextInput
                                type="number"
                                placeholder="0"
                                value={service.hours}
                                onChange={(e) =>
                                  updateAppointmentServiceRow(service.id, {
                                    hours: e.target.value === "" ? "" : Number(e.target.value),
                                  })
                                }
                                className="h-[52px] px-4 text-[16px]"
                              />
                            ) : (
                              <TextInput
                                type="number"
                                placeholder="0"
                                value={service.amount}
                                onChange={(e) =>
                                  updateAppointmentServiceRow(service.id, {
                                    amount: Number(e.target.value),
                                  })
                                }
                                className="h-[52px] px-4 text-[16px]"
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => removeAppointmentServiceRow(service.id)}
                              className="flex h-[52px] w-[44px] items-center justify-center rounded-[14px] border border-rose-400/18 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/14"
                            >
                              <CloseIcon />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between px-1 text-xs text-zinc-500">
                            <span>{service.type === "Запись" ? "Часы" : "Сумма"}</span>
                            <span className="text-zinc-300">
                              {formatMoney(normalizeServiceRow(service).amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ShellCard>

                  <ShellCard className="p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-semibold text-white">Оплата</p>
                        <p className="text-sm text-zinc-500">
                          Осталось: {formatMoney(remainingToPay)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {appointmentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3"
                        >
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_44px]">
                            <button
                              type="button"
                              onClick={() => setPaymentPickerRowId(payment.id)}
                              className="ui-input flex h-[52px] min-w-0 items-center justify-between px-4"
                            >
                              <span className="truncate text-[15px] text-white">{payment.type}</span>
                              <span className="ml-3 shrink-0 text-zinc-500">↕</span>
                            </button>

                            <TextInput
                              type="number"
                              placeholder="0"
                              value={payment.amount}
                              onChange={(e) =>
                                updateAppointmentPaymentRow(payment.id, {
                                  amount: Number(e.target.value),
                                })
                              }
                              className="h-[52px] px-4 text-[16px]"
                            />

                            <button
                              type="button"
                              onClick={() => removeAppointmentPaymentRow(payment.id)}
                              className="flex h-[52px] w-[44px] items-center justify-center rounded-[14px] border border-rose-400/18 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/14"
                            >
                              <CloseIcon />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <SecondaryButton
                        type="button"
                        onClick={() => addAppointmentPaymentRow("Нал")}
                        className="justify-center"
                      >
                        <PlusIcon />
                        Нал
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={() => addAppointmentPaymentRow("Карта")}
                        className="justify-center"
                      >
                        <PlusIcon />
                        Карта
                      </SecondaryButton>
                    </div>
                  </ShellCard>

                  <ShellCard className="p-4">
                    <FormLabel>Статус</FormLabel>
                    <SegmentedControl
                      options={[
                        { value: "Ожидание", label: "Ожидание" },
                        { value: "Пришел", label: "Пришёл" },
                        { value: "Не пришел", label: "Не пришёл" },
                      ]}
                      value={appointmentStatus}
                      onChange={setAppointmentStatus}
                    />

                    <div className="mt-4">
                      <FormLabel>Комментарий</FormLabel>
                      <TextArea
                        placeholder="Комментарий"
                        value={appointmentNote}
                        onChange={(e) => setAppointmentNote(e.target.value)}
                      />
                    </div>
                  </ShellCard>
                </div>
              </div>

              <div className="border-t border-white/8 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                <div className="grid grid-cols-[minmax(0,1fr)_52px] gap-3">
                  <PrimaryButton
                    type="button"
                    onClick={saveAppointment}
                    className="h-[56px] justify-center"
                  >
                    Сохранить запись
                  </PrimaryButton>

                  {editingAppointmentId ? (
                    <button
                      type="button"
                      onClick={() => deleteAppointment(editingAppointmentId)}
                      className="flex h-[56px] items-center justify-center rounded-[16px] border border-rose-400/18 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/14"
                    >
                      <TrashIcon />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAppointmentModal(false)}
                      className="flex h-[56px] items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.06]"
                    >
                      <CloseIcon />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <PickerSheet
          open={servicePickerRowId !== null}
          title="Выбери услугу"
          options={serviceOptions}
          value={activeServicePickerValue}
          onSelect={(value) => {
            if (servicePickerRowId === null) return
            updateAppointmentServiceRow(servicePickerRowId, {
              type: value,
              hours: value === "Запись" ? 1 : "",
              amount: value === "Запись" ? 1000 : 0,
            })
          }}
          onClose={() => setServicePickerRowId(null)}
        />

        <PickerSheet
          open={paymentPickerRowId !== null}
          title="Выбери тип оплаты"
          options={paymentOptions}
          value={activePaymentPickerValue}
          onSelect={(value) => {
            if (paymentPickerRowId === null) return
            updateAppointmentPaymentRow(paymentPickerRowId, {
              type: value,
            })
          }}
          onClose={() => setPaymentPickerRowId(null)}
        />
      </div>
    </div>
  )
}