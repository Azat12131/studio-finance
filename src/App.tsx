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
const DEFAULT_MONTH_GOAL = 150000

const ownerOptions: Owner[] = ["Азат", "Марс"]
const paymentOptions: PaymentType[] = ["Нал", "Карта"]
const serviceOptions: ServiceType[] = [
  "Запись",
  "Сведение",
  "Дистрибуция",
  "Мастеринг",
  "Другое",
]
const appointmentStatusOptions: AppointmentStatus[] = [
  "Ожидание",
  "Подтвердил",
  "Пришел",
  "Не пришел",
]

const quickServiceButtons: Array<{ type: ServiceType; label: string }> = [
  { type: "Запись", label: "Запись" },
  { type: "Сведение", label: "Сведение" },
  { type: "Мастеринг", label: "Мастеринг" },
  { type: "Дистрибуция", label: "Дистрибуция" },
]

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

function getPaymentRevenueMap(entries: FinancialEntry[]) {
  const map = new Map<PaymentType, number>()
  entries.forEach((entry) => {
    entry.payments.forEach((payment) => {
      map.set(payment.type, (map.get(payment.type) || 0) + Number(payment.amount || 0))
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
  if (status === "Ожидание") return "bg-white/[0.06] text-zinc-200 ring-1 ring-white/8"
  if (status === "Подтвердил") {
    return "bg-violet-500/15 text-violet-200 ring-1 ring-violet-300/10"
  }
  if (status === "Пришел") {
    return "bg-green-500/15 text-green-200 ring-1 ring-green-300/10"
  }
  return "bg-red-500/15 text-red-200 ring-1 ring-red-300/10"
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
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
      strokeWidth="1.9"
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
      strokeWidth="1.9"
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
      strokeWidth="1.9"
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
      strokeWidth="1.9"
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
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function EditIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
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

function SoftCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.02))] shadow-[0_22px_55px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[24px] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(69,136,255,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.08),transparent_22%)]" />
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClassName = "",
  subtext,
}: {
  label: string
  value: string
  valueClassName?: string
  subtext?: string
}) {
  return (
    <SoftCard className="p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${valueClassName}`}>{value}</p>
      {subtext ? <p className="mt-2 text-xs text-zinc-500">{subtext}</p> : null}
    </SoftCard>
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
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm text-zinc-400">{children}</p>
}

function TextInput({
  className = "",
  style,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <TextInput
      {...props}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))",
        color: "#ffffff",
        WebkitTextFillColor: "#ffffff",
        colorScheme: "dark",
        WebkitAppearance: "none",
        appearance: "none",
        ...style,
      }}
      className={`h-[50px] w-full rounded-[18px] bg-white/[0.035] px-4 text-[15px] text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_22px_rgba(0,0,0,0.12)] ring-1 ring-white/8 transition hover:ring-white/12 focus:ring-white/14 placeholder:text-zinc-500 ${className}`}
    />
  )
}

function SelectInput({
  className = "",
  style,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))",
        color: "#ffffff",
        WebkitTextFillColor: "#ffffff",
        colorScheme: "dark",
        WebkitAppearance: "none",
        appearance: "none",
        ...style,
      }}
      className={`h-[50px] w-full rounded-[18px] bg-white/[0.035] px-4 text-[15px] text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_22px_rgba(0,0,0,0.12)] ring-1 ring-white/8 transition hover:ring-white/12 focus:ring-white/14 ${className}`}
    >
      {children}
    </select>
  )
}

function DateInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <TextInput
      {...props}
      type="date"
      style={{ colorScheme: "dark" }}
      className={`h-[50px] w-full rounded-[18px] border border-white/10 bg-[#121826] px-4 text-[15px] text-white outline-none transition hover:border-white/20 focus:border-[#3b82f6] ${className}`}
    />
  )
}

function TimeInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <TextInput
      {...props}
      type="time"
      style={{ colorScheme: "dark" }}
      className={`h-[50px] w-full rounded-[18px] border border-white/10 bg-[#121826] px-4 text-[15px] text-white outline-none transition hover:border-white/20 focus:border-[#3b82f6] ${className}`}
    />
  )
}

function TextArea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-[18px] bg-white/[0.035] px-4 py-3 text-[15px] text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_22px_rgba(0,0,0,0.12)] ring-1 ring-white/8 transition hover:ring-white/12 focus:ring-white/14 placeholder:text-zinc-500 ${className}`}
    />
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
      <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-2">
        <div className="flex w-max gap-3 py-1">
          {months.map((monthKey) => {
            const active = monthKey === selectedMonth
            return (
              <button
                key={monthKey}
                onClick={() => onChange(monthKey)}
                className={`shrink-0 rounded-[20px] px-5 py-3 text-sm font-medium capitalize transition ${
                  active
                    ? "bg-[linear-gradient(180deg,#6d84ff,#4c63f0)] text-white ring-1 ring-white/10"
                    : "bg-white/[0.05] text-zinc-300 ring-1 ring-white/8 shadow-[0_6px_16px_rgba(0,0,0,0.16)] hover:bg-white/[0.08]"
                }`}
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
  return (
    <button
      onClick={() => onOpen(entry)}
      className="flex w-full items-center justify-between gap-3 rounded-[20px] bg-white/[0.04] px-4 py-4 text-left ring-1 ring-white/6 transition hover:bg-white/[0.07]"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-white">{entry.client}</p>
        <p className="mt-1 text-sm text-zinc-400">
          {formatDisplayDate(entry.date)} · {entry.owner}
        </p>
      </div>
      <p className="shrink-0 font-semibold text-white">
        {formatMoney(getPaymentsTotal(entry))}
      </p>
    </button>
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
    <aside className="hidden w-[280px] shrink-0 border-r border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-6 backdrop-blur-[24px] lg:flex lg:flex-col">
      <div className="mb-8">
        <img src={logo} alt="logo" className="h-auto w-[88px] object-contain opacity-95" />
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const active = item.key === activeTab
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-sm font-medium transition ${
                active
                  ? "bg-[linear-gradient(180deg,#6d84ff,#4c63f0)] text-white shadow-[0_16px_34px_rgba(79,101,255,0.28)]"
                  : "bg-white/[0.03] text-zinc-300 ring-1 ring-white/6 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={onAdd}
          className="w-full rounded-[20px] bg-[linear-gradient(180deg,#6d84ff,#4c63f0)] px-4 py-4 text-base font-semibold text-white shadow-[0_18px_38px_rgba(79,101,255,0.34)]"
        >
          + Новая запись
        </button>

        <button
          onClick={onCreateMonth}
          className="w-full rounded-[20px] bg-white/[0.04] px-4 py-4 text-base font-semibold text-white ring-1 ring-white/6 transition hover:bg-white/[0.07]"
        >
          + Новый месяц
        </button>
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
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] transition ${
      activeTab === tab ? "text-white" : "text-zinc-400"
    }`

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-[600] flex justify-center lg:hidden">
      <div className="pointer-events-auto mx-4 flex w-full max-w-[460px] items-center gap-2 rounded-[28px] bg-[rgba(13,16,24,0.72)] px-3 py-2 shadow-[0_24px_70px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/8 backdrop-blur-[24px]">
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
          <span>Аналитика</span>
        </button>

        <button className={itemClass("settings")} onClick={() => onChange("settings")}>
          <SettingsIcon />
          <span>Ещё</span>
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

  const paymentRevenueRows = React.useMemo(() => {
    const paymentRevenueMap = getPaymentRevenueMap(selectedMonthEntries)
    return paymentOptions.map((type) => [type, paymentRevenueMap.get(type) || 0] as const)
  }, [selectedMonthEntries])

  const topClient = React.useMemo(() => {
    const map = new Map<string, number>()
    selectedMonthEntries.forEach((entry) => {
      map.set(entry.client, (map.get(entry.client) || 0) + getPaymentsTotal(entry))
    })
    const rows = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    return rows[0] || null
  }, [selectedMonthEntries])

  const recentEntries = React.useMemo(() => {
    return selectedMonthEntries.slice(0, 5)
  }, [selectedMonthEntries])

  const uniqueClients = React.useMemo(() => {
    return Array.from(
      new Set(
        [
          ...legacyOperations.map((item) => item.client.trim()),
          ...appointments.map((item) => item.client.trim()),
        ].filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "ru"))
  }, [appointments, legacyOperations])

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
      if (item.amount === 0) return "rgba(239,68,68,0.72)"
      if (positiveAverage > 0 && item.amount < positiveAverage * 0.6) {
        return "rgba(250,204,21,0.82)"
      }
      return "rgba(34,197,94,0.82)"
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
          borderRadius: 12,
          barThickness: 16,
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
          labels: {
            color: "#d4d4d8",
          },
        },
        tooltip: {
          backgroundColor: "rgba(12,14,20,0.96)",
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
            color: "rgba(255,255,255,0.03)",
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
            color: "rgba(255,255,255,0.03)",
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

  const addQuickAppointmentService = React.useCallback((type: ServiceType) => {
    setAppointmentServices((prev) => [...prev, makeServiceRow(type)])
  }, [])

  const updateAppointmentServiceRow = React.useCallback((id: number, patch: Partial<ServiceItem>) => {
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
  }, [])

  const removeAppointmentServiceRow = React.useCallback((id: number) => {
    setAppointmentServices((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const addAppointmentPaymentRow = React.useCallback(() => {
    setAppointmentPayments((prev) => [...prev, makePaymentRow("Нал")])
  }, [])

  const updateAppointmentPaymentRow = React.useCallback((id: number, patch: Partial<PaymentItem>) => {
    setAppointmentPayments((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        return normalizePaymentRow({ ...row, ...patch })
      })
    )
  }, [])

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

  const deleteAppointment = React.useCallback(async (id: number) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) {
      console.error("Error deleting appointment", error)
      alert("Не удалось удалить запись")
      return
    }

    setAppointments((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const deleteLegacyOperation = React.useCallback(async (id: number) => {
    const { error } = await supabase.from("operations").delete().eq("id", id)

    if (error) {
      console.error("Error deleting legacy operation", error)
      alert("Не удалось удалить старую операцию")
      return
    }

    setLegacyOperations((prev) => prev.filter((item) => item.id !== id))
  }, [])

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
    // ================= RENDER =================

  return (
    <div className="flex min-h-screen bg-[#05060a] text-white">
      <SidebarNav
        activeTab={activeTab}
        onChange={setActiveTab}
        onAdd={openCreateAppointmentModal}
        onCreateMonth={createNewMonth}
        logo={logoWhite}
      />

      <main className="flex-1 p-4 pb-28 lg:p-8">
        {/* ================= DASHBOARD ================= */}
        {activeTab === "dashboard" && (
          <>
            <SectionTitle
              title="Главная"
              subtitle="Общий обзор бизнеса"
            />

            <MonthTabs
              months={normalizedMonths}
              selectedMonth={selectedMonth}
              onChange={setSelectedMonth}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Доход" value={formatMoney(monthIncome)} />
              <StatCard label="До аренды осталось" value={formatMoney(leftToRent)} />
              <StatCard label="До цели" value={formatMoney(leftToMonthGoal)} />
              <StatCard
                label="Чистая прибыль"
                value={formatMoney(profitAfterRent)}
                valueClassName={profitAfterRent >= 0 ? "text-green-400" : "text-red-400"}
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <SoftCard className="p-5">
                <p className="text-sm text-zinc-400">Доход по владельцам</p>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span>Азат</span>
                    <span>{formatMoney(azatIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Марс</span>
                    <span>{formatMoney(marsIncome)}</span>
                  </div>
                </div>
              </SoftCard>

              <SoftCard className="p-5">
                <p className="text-sm text-zinc-400">Лучший клиент</p>
                <p className="mt-4 text-lg font-semibold">
                  {topClient ? topClient[0] : "Нет данных"}
                </p>
                {topClient && (
                  <p className="text-sm text-zinc-400">
                    {formatMoney(topClient[1])}
                  </p>
                )}
              </SoftCard>
            </div>

            <div className="mt-6">
              <SectionTitle title="Последние операции" />
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <RecentOperationRow
                    key={entry.id}
                    entry={entry}
                    onOpen={openFinancialEntry}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= SCHEDULE ================= */}
        {activeTab === "schedule" && (
          <>
            <SectionTitle
              title="График"
              subtitle="Управление записями"
              action={
                <button
                  onClick={openCreateAppointmentModal}
                  className="rounded-[16px] bg-blue-600 px-4 py-2 text-sm"
                >
                  + Запись
                </button>
              }
            />

            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => shiftSelectedDate(-1)}>
                <ChevronLeftIcon />
              </button>

              <DateInput
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              <button onClick={() => shiftSelectedDate(1)}>
                <ChevronRightIcon />
              </button>
            </div>

            <div className="space-y-3">
              {selectedDateAppointments.map((a) => {
                const total = getServicesTotal(a)
                const paid = getPaymentsTotal(a)

                return (
                  <div
                    key={a.id}
                    onClick={() => openEditAppointmentModal(a)}
                    className="rounded-[20px] bg-[#0b0c11] p-4 border border-white/5 cursor-pointer"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">
                          {a.startTime} – {a.endTime}
                        </p>
                        <p className="text-lg font-semibold mt-1">
                          {a.client}
                        </p>
                        <span className={`mt-2 inline-block px-2 py-1 text-xs rounded ${getStatusPillClass(a.status)}`}>
                          {a.status}
                        </span>
                      </div>

                      <div className="text-right">
                        <p>{formatMoney(paid)}</p>
                        <p className="text-xs text-zinc-500">
                          из {formatMoney(total)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ================= FINANCE ================= */}
        {activeTab === "operations" && (
          <>
            <SectionTitle title="Финансы" />

            <div className="space-y-3">
              {selectedMonthEntries.map((entry) => (
                <RecentOperationRow
                  key={entry.id}
                  entry={entry}
                  onOpen={openFinancialEntry}
                />
              ))}
            </div>
          </>
        )}

        {/* ================= ANALYTICS ================= */}
        {activeTab === "analytics" && (
          <>
            <SectionTitle title="Аналитика" />

            <SoftCard className="p-5 h-[300px]">
              <Bar data={chartData} options={chartOptions} />
            </SoftCard>
          </>
        )}

        {/* ================= SETTINGS ================= */}
        {activeTab === "settings" && (
          <>
            <SectionTitle title="Настройки" />

            <div className="space-y-4">
              <button
                onClick={deleteSelectedMonth}
                className="bg-red-500 px-4 py-2 rounded"
              >
                Удалить месяц
              </button>
            </div>
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {/* ================= APPOINTMENT SHEET ================= */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-[999] bg-black/70">
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-[520px] bg-white text-black rounded-t-[30px] p-4 max-h-[90vh] overflow-y-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setShowAppointmentModal(false)}>✕</button>
              <h2 className="font-semibold">Запись</h2>
              {editingAppointmentId && (
                <button onClick={() => deleteAppointment(editingAppointmentId)}>
                  🗑
                </button>
              )}
            </div>

            {/* STATUS */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {appointmentStatusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setAppointmentStatus(s)}
                  className={`py-2 rounded ${
                    appointmentStatus === s ? "bg-black text-white" : "bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* CLIENT */}
            <TextInput
              placeholder="Имя"
              value={appointmentClient}
              onChange={(e) => setAppointmentClient(e.target.value)}
            />
            <div className="mt-2">
              <TextInput
                placeholder="Телефон"
                value={appointmentPhone}
                onChange={(e) => setAppointmentPhone(e.target.value)}
              />
            </div>

            {/* TIME */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <TimeInput
                value={appointmentStartTime}
                onChange={(e) => setAppointmentStartTime(e.target.value)}
              />
              <TimeInput
                value={appointmentEndTime}
                onChange={(e) => setAppointmentEndTime(e.target.value)}
              />
            </div>

            {/* SERVICES */}
            <div className="mt-4">
              <p className="text-sm text-gray-500">Услуги</p>

              {appointmentServices.map((s) => (
                <div key={s.id} className="flex gap-2 mt-2">
                  <SelectInput
                    value={s.type}
                    onChange={(e) =>
                      updateAppointmentServiceRow(s.id, { type: e.target.value as ServiceType })
                    }
                  >
                    {serviceOptions.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </SelectInput>

                  <TextInput
                    placeholder="Сумма"
                    value={s.amount}
                    onChange={(e) =>
                      updateAppointmentServiceRow(s.id, {
                        amount: Number(e.target.value),
                      })
                    }
                  />

                  <button onClick={() => removeAppointmentServiceRow(s.id)}>
                    ✕
                  </button>
                </div>
              ))}

              <button onClick={addAppointmentServiceRow} className="mt-2">
                + Услуга
              </button>
            </div>

            {/* PAYMENTS */}
            <div className="mt-5 border-t pt-4">
              <p>К оплате: {formatMoney(currentAppointmentServicesTotal - currentAppointmentPaymentsTotal)}</p>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() =>
                    setAppointmentPayments([
                      ...appointmentPayments,
                      {
                        id: makeId(),
                        type: "Нал",
                        amount: currentAppointmentServicesTotal - currentAppointmentPaymentsTotal,
                      },
                    ])
                  }
                  className="bg-yellow-400 py-3 rounded"
                >
                  Нал
                </button>

                <button
                  onClick={() =>
                    setAppointmentPayments([
                      ...appointmentPayments,
                      {
                        id: makeId(),
                        type: "Карта",
                        amount: currentAppointmentServicesTotal - currentAppointmentPaymentsTotal,
                      },
                    ])
                  }
                  className="bg-yellow-400 py-3 rounded"
                >
                  Карта
                </button>
              </div>
            </div>

            {/* SAVE */}
            <button
              onClick={saveAppointment}
              className="mt-5 w-full bg-black text-white py-3 rounded"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}