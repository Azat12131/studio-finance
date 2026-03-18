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

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}

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
  if (status === "Ожидание") {
    return "bg-white/[0.06] text-zinc-200 ring-1 ring-white/10"
  }
  if (status === "Подтвердил") {
    return "bg-sky-400/12 text-sky-200 ring-1 ring-sky-300/18"
  }
  if (status === "Пришел") {
    return "bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/18"
  }
  return "bg-rose-400/12 text-rose-200 ring-1 ring-rose-300/18"
}

function getOwnerGlow(owner: Owner) {
  return owner === "Азат"
    ? "from-[#8be4ff] via-[#5f96ff] to-[#7d6bff]"
    : "from-[#7dd3fc] via-[#6d78ff] to-[#b16dff]"
}

function getProgressWidth(value: number, total: number) {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20v-12" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 13.8 5l2.4-.3.8 2.3 2 1.3-1 2 1 2-2 1.3-.8 2.3-2.4-.3L12 20.5l-1.8-1.5-2.4.3-.8-2.3-2-1.3 1-2-1-2 2-1.3.8-2.3 2.4.3L12 3.5Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 11.8 19.86 19.86 0 0 1 2.08 3.09 2 2 0 0 1 4.06.92h2a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L7.1 8.91a16 16 0 0 0 8 8l1.54-1.14a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </svg>
  )
}

function GlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div className={cn("neo-card animate-fade-up", glow && "neo-card-glow", className)}>
      {children}
    </div>
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
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98a8d4] backdrop-blur-xl">
          <SparkIcon />
          Studio control
        </div>
        <h1 className="mt-4 truncate text-[34px] font-semibold tracking-[-0.055em] text-white sm:text-[42px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-[720px] text-[14px] text-[#8f98b3] sm:text-[15px]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("btn-primary", className)}>
      {children}
    </button>
  )
}

function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("btn-ghost", className)}>
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
    <button {...props} className={cn("icon-button", className)}>
      {children}
    </button>
  )
}

function TextInput({
  className = "",
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
      className={cn("field-input", className)}
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
      className={cn("field-textarea", className)}
    />
  )
}

function InputWithIcon({
  icon,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode
}) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <div className={cn("field-input flex items-center gap-3 px-4", className)}>
      <div className="shrink-0 text-[#7280a5]">{icon}</div>
      <input
        {...props}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        placeholder={isFocused ? "" : props.placeholder}
        className="h-full w-full min-w-0 border-0 bg-transparent p-0 text-[15px] font-medium text-white outline-none placeholder:text-[rgba(214,223,247,0.48)]"
      />
    </div>
  )
}

function ProgressLine({
  value,
  total,
  colorClassName,
  heightClassName = "h-[12px]",
}: {
  value: number
  total: number
  colorClassName: string
  heightClassName?: string
}) {
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", heightClassName)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out shadow-[0_0_30px_rgba(111,147,255,0.25)]",
          colorClassName
        )}
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
                  "rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition duration-200",
                  active
                    ? "bg-[linear-gradient(135deg,rgba(122,175,255,0.95),rgba(121,104,255,0.95))] text-white shadow-[0_10px_28px_rgba(71,112,255,0.34)]"
                    : "border border-white/8 bg-white/[0.04] text-[#9aa5c3] hover:border-white/12 hover:bg-white/[0.06] hover:text-white"
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

function StatMini({
  label,
  value,
  sub,
  accent = "default",
}: {
  label: string
  value: string
  sub?: string
  accent?: "default" | "good" | "danger"
}) {
  return (
    <GlassCard className="p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7d89ab]">
        {label}
      </p>
      <p
        className={cn(
          "mt-4 text-[30px] font-semibold tracking-[-0.05em]",
          accent === "good" && "text-emerald-300",
          accent === "danger" && "text-rose-300",
          accent === "default" && "text-white"
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-2 text-sm text-[#8f98b3]">{sub}</p> : null}
    </GlassCard>
  )
}

function RecentOperationRow({
  entry,
  onOpen,
}: {
  entry: FinancialEntry
  onOpen: (entry: FinancialEntry) => void
}) {
  return (
    <button onClick={() => onOpen(entry)} className="finance-row group">
      <div className="flex min-w-0 items-center gap-4">
        <div className="finance-row-icon">
          {entry.source === "appointment" ? <CalendarIcon /> : <ReceiptIcon />}
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-white">{entry.client}</p>
            <span className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-[#9aa5c3]">
              {entry.owner}
            </span>
          </div>

          <p className="mt-1 text-sm text-[#7f8aa8]">
            {formatDisplayDate(entry.date)} · {entry.services.length} усл.
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[17px] font-semibold tracking-[-0.03em] text-white">
          {formatMoney(getPaymentsTotal(entry))}
        </p>
        <p className="mt-1 text-xs text-[#7380a2]">
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
      className={cn("field-input flex h-[58px] items-center gap-3 px-4 text-left", className)}
    >
      {icon ? <div className="shrink-0 text-[#7f8cb0]">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[15px] font-medium", value ? "text-white" : "text-[#7f8aa8]")}>
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
        icon={<CalendarIcon />}
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
    <div className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="sheet-panel absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[560px] rounded-t-[34px] px-4 pb-6 pt-4">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/12" />

        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-[18px] font-semibold tracking-[-0.03em] text-white">{title}</p>
          <IconButton onClick={onClose} className="h-10 w-10 rounded-full">
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
                  "flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left transition",
                  active
                    ? "bg-[linear-gradient(135deg,rgba(122,175,255,0.95),rgba(121,104,255,0.95))] text-white shadow-[0_14px_32px_rgba(70,108,255,0.32)]"
                    : "border border-white/8 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.06]"
                )}
              >
                <span className="font-medium">{option}</span>
                {active ? <span className="text-sm text-white/75">Выбрано</span> : null}
              </button>
            )
          })}
        </div>
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
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-1.5 backdrop-blur-xl">
      <div style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }} className="grid gap-1.5">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-[48px] rounded-[16px] px-3 text-[14px] font-semibold transition",
                active
                  ? "bg-[linear-gradient(135deg,rgba(122,175,255,0.95),rgba(121,104,255,0.95))] text-white shadow-[0_10px_24px_rgba(65,106,255,0.28)]"
                  : "text-[#9aa5c3] hover:bg-white/[0.05] hover:text-white"
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
  return (
    <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7684a9]">
      {children}
    </p>
  )
}

function DashboardHero({
  selectedMonth,
  monthIncome,
  monthGoal,
  leftToMonthGoal,
  leftToRent,
  azatIncome,
  marsIncome,
  profitAfterRent,
}: {
  selectedMonth: string
  monthIncome: number
  monthGoal: number
  leftToMonthGoal: number
  leftToRent: number
  azatIncome: number
  marsIncome: number
  profitAfterRent: number
}) {
  return (
    <GlassCard glow className="relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6 xl:px-7">
      <div className="pointer-events-none absolute -left-16 top-[-30px] h-[220px] w-[220px] rounded-full bg-[#71dfff]/12 blur-[80px]" />
      <div className="pointer-events-none absolute right-[-30px] top-[20px] h-[220px] w-[220px] rounded-full bg-[#6d63ff]/14 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[-50px] left-[32%] h-[180px] w-[180px] rounded-full bg-[#4fd4ff]/10 blur-[86px]" />

      <div className="relative z-[1] grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a2afd0]">
            Финансовый центр
          </div>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#90a0c4]">Доход за месяц</p>
              <h2 className="mt-3 text-[42px] font-semibold tracking-[-0.07em] text-white sm:text-[56px]">
                {formatMoney(monthIncome)}
              </h2>
              <p className="mt-2 text-sm text-[#7f8aa8]">{formatMonthLabel(selectedMonth)}</p>
            </div>

            <div className="stats-chip">
              <span className={cn("inline-block h-2.5 w-2.5 rounded-full", profitAfterRent >= 0 ? "bg-emerald-300" : "bg-rose-300")} />
              {profitAfterRent >= 0 ? "План под контролем" : "Нужно добрать план"}
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="metric-panel">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="text-sm text-[#9cabcd]">Цель месяца</span>
                <span className="text-sm font-semibold text-white">{formatMoney(monthGoal)}</span>
              </div>
              <ProgressLine
                value={monthIncome}
                total={monthGoal}
                colorClassName="from-[#8be4ff] via-[#5f96ff] to-[#7d6bff]"
              />
              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-[#7f8aa8]">
                <span>Осталось до цели</span>
                <span>{formatMoney(leftToMonthGoal)}</span>
              </div>
            </div>

            <div className="metric-panel">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="text-sm text-[#9cabcd]">Аренда</span>
                <span className="text-sm font-semibold text-white">{formatMoney(RENT_GOAL)}</span>
              </div>
              <ProgressLine
                value={monthIncome}
                total={RENT_GOAL}
                colorClassName="from-[#63ffd8] via-[#4fb6ff] to-[#5f84ff]"
              />
              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-[#7f8aa8]">
                <span>Осталось до аренды</span>
                <span>{formatMoney(leftToRent)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="owner-card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm text-[#9cabcd]">Азат</span>
              <span className="text-[24px] font-semibold tracking-[-0.04em] text-white">
                {formatMoney(azatIncome)}
              </span>
            </div>
            <ProgressLine
              value={azatIncome}
              total={Math.max(monthIncome, 1)}
              colorClassName={getOwnerGlow("Азат")}
              heightClassName="h-[10px]"
            />
          </div>

          <div className="owner-card owner-card-alt">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm text-[#9cabcd]">Марс</span>
              <span className="text-[24px] font-semibold tracking-[-0.04em] text-white">
                {formatMoney(marsIncome)}
              </span>
            </div>
            <ProgressLine
              value={marsIncome}
              total={Math.max(monthIncome, 1)}
              colorClassName={getOwnerGlow("Марс")}
              heightClassName="h-[10px]"
            />
          </div>

          <div className="profit-panel">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7c8ab0]">
              Чистая прибыль
            </p>
            <p className={cn("mt-3 text-[34px] font-semibold tracking-[-0.06em]", profitAfterRent >= 0 ? "text-white" : "text-rose-300")}>
              {formatMoney(profitAfterRent)}
            </p>
            <p className="mt-2 text-sm text-[#8b97b5]">Доход минус аренда</p>
          </div>
        </div>
      </div>
    </GlassCard>
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
    <aside className="sidebar-shell hidden lg:flex">
      <div className="sidebar-panel">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="logo-shell">
              <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_30%_25%,rgba(125,227,255,0.24),transparent_35%),radial-gradient(circle_at_70%_75%,rgba(112,92,255,0.22),transparent_40%)]" />
              <img src={logo} alt="logo" className="relative h-6 w-auto object-contain opacity-95" />
            </div>

            <div>
              <p className="text-[16px] font-semibold tracking-[-0.03em] text-white">
                Studio CRM
              </p>
              <p className="mt-1 text-xs text-[#7f8aa8]">Premium control panel</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {items.map((item) => {
            const active = item.key === activeTab
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={cn("sidebar-link", active && "sidebar-link-active")}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-8 grid gap-3">
          <PrimaryButton onClick={onAdd} className="w-full justify-center h-[50px]">
            <PlusIcon />
            Новая запись
          </PrimaryButton>

          <GhostButton onClick={onCreateMonth} className="w-full justify-center h-[50px]">
            <PlusIcon />
            Новый месяц
          </GhostButton>
        </div>

        <div className="mt-auto">
          <div className="sidebar-footer">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b88aa]">
              Focus mode
            </p>
            <p className="mt-2 text-sm leading-6 text-[#99a4c2]">
              Темный холодный интерфейс без белых рамок, с глубиной, стеклом и читаемой иерархией.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function BottomNav({
  activeTab,
  onChange,
  onAdd,
  hidden = false,
}: {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
  onAdd: () => void
  hidden?: boolean
}) {
  if (hidden) return null

  const itemClass = (tab: AppTab) =>
    cn("mobile-nav-item", activeTab === tab && "mobile-nav-item-active")

  return (
    <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-[700] flex justify-center lg:hidden">
      <div className="pointer-events-auto mobile-nav-shell">
        <button className={itemClass("dashboard")} onClick={() => onChange("dashboard")}>
          <HomeIcon />
        </button>

        <button className={itemClass("schedule")} onClick={() => onChange("schedule")}>
          <CalendarIcon />
        </button>

        <button onClick={onAdd} className="mobile-nav-add">
          <PlusIcon />
        </button>

        <button className={itemClass("operations")} onClick={() => onChange("operations")}>
          <ReceiptIcon />
        </button>

        <button className={itemClass("analytics")} onClick={() => onChange("analytics")}>
          <ChartIcon />
        </button>
      </div>
    </div>
  )
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
      if (item.amount === 0) return "rgba(255,255,255,0.09)"
      if (positiveAverage > 0 && item.amount < positiveAverage * 0.6) {
        return "rgba(100,162,255,0.70)"
      }
      return "rgba(102,255,226,0.85)"
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
        duration: 900,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(8,12,22,0.98)",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          titleColor: "#ffffff",
          bodyColor: "#d9e0f2",
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
            color: "#7782a5",
            font: { size: 11, weight: 600 },
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
            color: "#7782a5",
            callback(value) {
              return formatMoney(Number(value))
            },
            font: { size: 11, weight: 600 },
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
    <div className="min-h-screen overflow-x-hidden bg-[#050811] text-white">
      <div className="app-background" />
      <div className="app-orb app-orb-a" />
      <div className="app-orb app-orb-b" />
      <div className="app-orb app-orb-c" />

      <div className="flex min-h-screen w-full">
        <SidebarNav
          activeTab={activeTab}
          onChange={setActiveTab}
          onAdd={openCreateAppointmentModal}
          onCreateMonth={createNewMonth}
          logo={logoWhite}
        />

        <main className="main-shell min-w-0 flex-1 px-4 pb-32 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
          {activeTab === "dashboard" && (
            <>
              <SectionTitle
                title="Главная"
                subtitle="Центр управления студией: доход, план, лидеры месяца и ключевые точки роста."
                action={
                  <PrimaryButton
                    onClick={openCreateAppointmentModal}
                    className="hidden sm:inline-flex"
                  >
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

              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <DashboardHero
                  selectedMonth={selectedMonth}
                  monthIncome={monthIncome}
                  monthGoal={monthGoal}
                  leftToMonthGoal={leftToMonthGoal}
                  leftToRent={leftToRent}
                  azatIncome={azatIncome}
                  marsIncome={marsIncome}
                  profitAfterRent={profitAfterRent}
                />

                <div className="grid gap-4">
                  <StatMini
                    label="Осталось до цели"
                    value={formatMoney(leftToMonthGoal)}
                    sub="Сколько не хватает до плана"
                  />
                  <StatMini
                    label="Лучший клиент"
                    value={topClient ? topClient[0] : "Нет данных"}
                    sub={topClient ? formatMoney(topClient[1]) : "Пока нет лидера"}
                  />
                  <GlassCard className="p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7b88aa]">
                      Топ услуг
                    </p>
                    <div className="mt-4 space-y-3">
                      {serviceRevenueRows.length > 0 ? (
                        serviceRevenueRows.slice(0, 4).map(([service, amount], index) => (
                          <div key={service} className="metric-row">
                            <div className="flex items-center gap-3">
                              <span className="metric-dot">{index + 1}</span>
                              <span className="text-sm font-medium text-white">{service}</span>
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {formatMoney(amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#8b97b5]">Пока нет данных</p>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <GlassCard className="p-5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7b88aa]">
                    План / аренда
                  </p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-sm text-[#9cabcd]">План</span>
                        <span className="text-sm font-semibold text-white">
                          {formatMoney(monthGoal)}
                        </span>
                      </div>
                      <ProgressLine
                        value={monthIncome}
                        total={monthGoal}
                        colorClassName="from-[#86dcff] via-[#6493ff] to-[#7a69ff]"
                        heightClassName="h-[9px]"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-sm text-[#9cabcd]">Аренда</span>
                        <span className="text-sm font-semibold text-white">
                          {formatMoney(RENT_GOAL)}
                        </span>
                      </div>
                      <ProgressLine
                        value={monthIncome}
                        total={RENT_GOAL}
                        colorClassName="from-[#67ffe0] via-[#58b9ff] to-[#5f85ff]"
                        heightClassName="h-[9px]"
                      />
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7b88aa]">
                    Доходы по владельцам
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="owner-inline">
                      <span className="text-sm text-white">Азат</span>
                      <span className="text-sm font-semibold text-white">
                        {formatMoney(azatIncome)}
                      </span>
                    </div>
                    <div className="owner-inline">
                      <span className="text-sm text-white">Марс</span>
                      <span className="text-sm font-semibold text-white">
                        {formatMoney(marsIncome)}
                      </span>
                    </div>
                  </div>
                </GlassCard>

                <StatMini
                  label="Чистая прибыль"
                  value={formatMoney(profitAfterRent)}
                  sub="Доход минус аренда"
                  accent={profitAfterRent >= 0 ? "good" : "danger"}
                />

                <GlassCard className="p-5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7b88aa]">
                    Записей в месяце
                  </p>
                  <p className="mt-4 text-[34px] font-semibold tracking-[-0.05em] text-white">
                    {selectedMonthEntries.length}
                  </p>
                  <p className="mt-2 text-sm text-[#8f98b3]">
                    Все операции и записи, попавшие в выбранный месяц.
                  </p>
                </GlassCard>
              </div>
            </>
          )}

          {activeTab === "schedule" && (
            <>
              <SectionTitle
                title="График"
                subtitle="Записи на выбранную дату с быстрым переходом в карточку клиента."
                action={
                  <PrimaryButton onClick={openCreateAppointmentModal}>
                    <PlusIcon />
                    Запись
                  </PrimaryButton>
                }
              />

              <GlassCard className="mb-4 p-3.5 sm:p-4">
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
              </GlassCard>

              <div className="space-y-3">
                {selectedDateAppointments.map((a) => {
                  const total = getServicesTotal(a)
                  const paid = getPaymentsTotal(a)

                  return (
                    <button
                      key={a.id}
                      onClick={() => openEditAppointmentModal(a)}
                      className="schedule-card"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-[#97a3c5]">
                              {a.startTime} — {a.endTime}
                            </span>
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
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

                          <p className="mt-4 truncate text-[22px] font-semibold tracking-[-0.04em] text-white">
                            {a.client}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#8794b5]">
                            <span>{a.owner}</span>
                            {a.phone ? <span>· {a.phone}</span> : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[22px] font-semibold tracking-[-0.04em] text-white">
                            {formatMoney(paid)}
                          </p>
                          <p className="mt-1 text-xs text-[#7581a3]">
                            из {formatMoney(total)}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {selectedDateAppointments.length === 0 && (
                  <GlassCard className="p-6">
                    <p className="text-[18px] font-semibold tracking-[-0.03em] text-white">
                      На эту дату записей нет
                    </p>
                    <p className="mt-2 text-sm text-[#8b97b5]">
                      Добавь новую запись через кнопку сверху или через центральную кнопку внизу.
                    </p>
                  </GlassCard>
                )}
              </div>
            </>
          )}

          {activeTab === "operations" && (
            <>
              <SectionTitle
                title="Финансы"
                subtitle="Лента операций в банковом стиле: чисто, плотно и без лишнего шума."
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
                  <GlassCard className="p-6">
                    <p className="text-[18px] font-semibold tracking-[-0.03em] text-white">
                      Пока пусто
                    </p>
                    <p className="mt-2 text-sm text-[#8b97b5]">
                      За этот месяц данных пока нет.
                    </p>
                  </GlassCard>
                )}
              </div>
            </>
          )}

          {activeTab === "analytics" && (
            <>
              <SectionTitle
                title="Аналитика"
                subtitle="Динамика выручки по дням и лучшие точки месяца."
              />

              <MonthTabs
                months={normalizedMonths}
                selectedMonth={selectedMonth}
                onChange={setSelectedMonth}
              />

              <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
                <GlassCard className="p-5 sm:p-6" glow>
                  <div className="mb-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7b88aa]">
                      Выручка по дням
                    </p>
                    <p className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-white">
                      {formatMonthLabel(selectedMonth)}
                    </p>
                  </div>
                  <div className="h-[290px]">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </GlassCard>

                <div className="grid gap-4">
                  <GlassCard className="p-5 sm:p-6">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7b88aa]">
                      Лучшие дни месяца
                    </p>
                    <div className="mt-4 space-y-3">
                      {dailyStats.bestDays.length > 0 ? (
                        dailyStats.bestDays.map((day, index) => (
                          <div key={day.dateKey} className="analytics-day-card">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-xs text-[#7f8aa8]">#{index + 1}</p>
                                <p className="mt-1 text-sm font-semibold text-white">
                                  {formatDisplayDate(day.dateKey)}
                                </p>
                              </div>
                              <span className="text-sm font-semibold text-white">
                                {formatMoney(day.amount)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#8b97b5]">Пока нет успешных дней</p>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 sm:p-6">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7b88aa]">
                      Слабые дни
                    </p>
                    <p className="mt-3 text-[34px] font-semibold tracking-[-0.05em] text-white">
                      {dailyStats.weakDays}
                    </p>
                    <p className="mt-2 text-sm text-[#8b97b5]">
                      Дней без движения в выбранном месяце.
                    </p>
                  </GlassCard>
                </div>
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <SectionTitle
                title="Настройки"
                subtitle="Управление целями, месяцами и системными действиями."
              />

              <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                <GlassCard className="p-5 sm:p-6">
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
                  <p className="mt-3 text-sm text-[#8b97b5]">
                    Актуальная цель для {formatMonthLabel(selectedMonth)}.
                  </p>
                </GlassCard>

                <GlassCard className="p-5 sm:p-6">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b68ea4]">
                    Опасная зона
                  </p>
                  <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-white">
                    Удаление месяца
                  </p>
                  <p className="mt-2 text-sm text-[#8b97b5]">
                    Будут удалены операции, записи и цель выбранного месяца.
                  </p>
                  <button onClick={deleteSelectedMonth} className="danger-button mt-5">
                    Удалить месяц
                  </button>
                </GlassCard>
              </div>
            </>
          )}
        </main>

        <BottomNav
          activeTab={activeTab}
          onChange={setActiveTab}
          onAdd={openCreateAppointmentModal}
          hidden={showAppointmentModal}
        />

        {showAppointmentModal && (
          <div className="fixed inset-0 z-[999] bg-black/74 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setShowAppointmentModal(false)} />

            <div className="modal-panel absolute bottom-0 left-0 right-0 mx-auto flex h-[min(92vh,980px)] w-full max-w-[780px] flex-col rounded-t-[36px]">
              <div className="pointer-events-none absolute left-[8%] top-0 h-[180px] w-[180px] rounded-full bg-[#69e1ff]/10 blur-[78px]" />
              <div className="pointer-events-none absolute right-[10%] top-[0px] h-[180px] w-[180px] rounded-full bg-[#705dff]/12 blur-[88px]" />

              <div className="relative z-[1] px-4 pt-4 sm:px-6">
                <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/12" />

                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b88aa]">
                      {editingAppointmentId ? "Редактирование" : "Новая запись"}
                    </p>
                    <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.05em] text-white">
                      {editingAppointmentId ? "Карточка записи" : "Создание записи"}
                    </h2>
                  </div>

                  <IconButton onClick={() => setShowAppointmentModal(false)}>
                    <CloseIcon />
                  </IconButton>
                </div>
              </div>

              <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
                <div className="space-y-4 pb-4">
                  <GlassCard className="p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FormLabel>Клиент</FormLabel>
                        <InputWithIcon
                          icon={<UserIcon />}
                          placeholder="Имя клиента"
                          value={appointmentClient}
                          onChange={(e) => setAppointmentClient(e.target.value)}
                        />
                      </div>

                      <div>
                        <FormLabel>Телефон</FormLabel>
                        <InputWithIcon
                          icon={<PhoneIcon />}
                          type="tel"
                          placeholder="Телефон"
                          value={appointmentPhone}
                          onChange={(e) => setAppointmentPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4 sm:p-5">
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
                  </GlassCard>

                  <GlassCard className="p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[18px] font-semibold tracking-[-0.03em] text-white">
                          Услуги
                        </p>
                        <p className="text-sm text-[#8b97b5]">Состав и стоимость записи</p>
                      </div>
                      <IconButton onClick={addAppointmentServiceRow}>
                        <PlusIcon />
                      </IconButton>
                    </div>

                    <div className="space-y-3">
                      {appointmentServices.map((service) => (
                        <div key={service.id} className="inner-block">
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_48px]">
                            <button
                              type="button"
                              onClick={() => setServicePickerRowId(service.id)}
                              className="field-input flex h-[54px] min-w-0 items-center justify-between px-4"
                            >
                              <span className="truncate text-[15px] font-medium text-white">
                                {service.type}
                              </span>
                              <span className="ml-3 shrink-0 text-[#7b88aa]">↕</span>
                            </button>

                            {service.type === "Запись" ? (
                              <TextInput
                                type="number"
                                placeholder="0"
                                value={
                                  service.hours === "" || service.hours === 0
                                    ? ""
                                    : String(service.hours)
                                }
                                onChange={(e) =>
                                  updateAppointmentServiceRow(service.id, {
                                    hours: e.target.value === "" ? "" : Number(e.target.value),
                                  })
                                }
                                className="h-[54px] px-4 text-[16px] font-semibold"
                              />
                            ) : (
                              <TextInput
                                type="number"
                                placeholder="0"
                                value={service.amount === 0 ? "" : String(service.amount)}
                                onChange={(e) =>
                                  updateAppointmentServiceRow(service.id, {
                                    amount: e.target.value === "" ? 0 : Number(e.target.value),
                                  })
                                }
                                className="h-[54px] px-4 text-[16px] font-semibold"
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => removeAppointmentServiceRow(service.id)}
                              className="remove-mini-button"
                            >
                              <CloseIcon />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between px-1 text-xs text-[#7f8aa8]">
                            <span>{service.type === "Запись" ? "Часы" : "Сумма"}</span>
                            <span className="font-semibold text-white">
                              {formatMoney(normalizeServiceRow(service).amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[18px] font-semibold tracking-[-0.03em] text-white">
                          Оплата
                        </p>
                        <p className="text-sm text-[#8b97b5]">
                          Осталось: {formatMoney(remainingToPay)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {appointmentPayments.map((payment) => (
                        <div key={payment.id} className="inner-block">
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_48px]">
                            <button
                              type="button"
                              onClick={() => setPaymentPickerRowId(payment.id)}
                              className="field-input flex h-[54px] min-w-0 items-center justify-between px-4"
                            >
                              <span className="truncate text-[15px] font-medium text-white">
                                {payment.type}
                              </span>
                              <span className="ml-3 shrink-0 text-[#7b88aa]">↕</span>
                            </button>

                            <TextInput
                              type="number"
                              placeholder="0"
                              value={payment.amount === 0 ? "" : String(payment.amount)}
                              onChange={(e) =>
                                updateAppointmentPaymentRow(payment.id, {
                                  amount: e.target.value === "" ? 0 : Number(e.target.value),
                                })
                              }
                              className="h-[54px] px-4 text-[16px] font-semibold"
                            />

                            <button
                              type="button"
                              onClick={() => removeAppointmentPaymentRow(payment.id)}
                              className="remove-mini-button"
                            >
                              <CloseIcon />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <GhostButton
                        type="button"
                        onClick={() => addAppointmentPaymentRow("Нал")}
                        className="justify-center"
                      >
                        <PlusIcon />
                        Нал
                      </GhostButton>
                      <GhostButton
                        type="button"
                        onClick={() => addAppointmentPaymentRow("Карта")}
                        className="justify-center"
                      >
                        <PlusIcon />
                        Карта
                      </GhostButton>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4 sm:p-5">
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
                  </GlassCard>
                </div>
              </div>

              <div className="relative z-[1] border-t border-white/8 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                <div className="grid grid-cols-[minmax(0,1fr)_56px] gap-3">
                  <PrimaryButton
                    type="button"
                    onClick={saveAppointment}
                    className="h-[58px] justify-center"
                  >
                    Сохранить запись
                  </PrimaryButton>

                  {editingAppointmentId ? (
                    <button
                      type="button"
                      onClick={() => deleteAppointment(editingAppointmentId)}
                      className="remove-large-button"
                    >
                      <TrashIcon />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAppointmentModal(false)}
                      className="modal-close-button"
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