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

const RENT_GOAL = 20000
const DEFAULT_MONTH_GOAL = 150000
const ONLINE_NET_AMOUNT = 487.5

const ownerOptions: Owner[] = ["Азат", "Марс"]
const paymentOptions: PaymentType[] = ["Нал", "Карта", "Онлайн"]
const serviceOptions: ServiceType[] = [
  "Запись",
  "Сведение",
  "Дистрибуция",
  "Мастеринг",
  "Другое",
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

function getPaymentsTotal(operation: Operation) {
  return operation.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

function getServiceRevenueMap(operations: Operation[]) {
  const map = new Map<ServiceType, number>()
  operations.forEach((operation) => {
    operation.services.forEach((service) => {
      map.set(service.type, (map.get(service.type) || 0) + Number(service.amount || 0))
    })
  })
  return map
}

function getPaymentRevenueMap(operations: Operation[]) {
  const map = new Map<PaymentType, number>()
  operations.forEach((operation) => {
    operation.payments.forEach((payment) => {
      map.set(payment.type, (map.get(payment.type) || 0) + Number(payment.amount || 0))
    })
  })
  return map
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
    hours: Number(row.hours) || 0,
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

function normalizePayments(rawPayments: unknown): PaymentItem[] {
  if (!Array.isArray(rawPayments)) return []
  return rawPayments.map((item, index) => {
    const raw = item as Partial<PaymentItem>
    const type = (raw.type as PaymentType) || "Нал"
    return {
      id: Number(raw.id) || makeId() + index,
      type,
      amount: type === "Онлайн" ? ONLINE_NET_AMOUNT : Number(raw.amount) || 0,
    }
  })
}

function normalizeServices(rawServices: unknown): ServiceItem[] {
  if (!Array.isArray(rawServices)) return []
  return rawServices.map((item, index) => {
    const raw = item as Partial<ServiceItem>
    const type = (raw.type as ServiceType) || "Запись"
    const hours = Number(raw.hours) || (type === "Запись" ? 1 : 0)
    const amount = type === "Запись" ? hours * 1000 : Number(raw.amount) || 0

    return {
      id: Number(raw.id) || makeId() + index,
      type,
      hours,
      amount,
    }
  })
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20v-12" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 13.8 5l2.4-.3.8 2.3 2 1.3-1 2 1 2-2 1.3-.8 2.3-2.4-.3L12 20.5l-1.8-1.5-2.4.3-.8-2.3-2-1.3 1-2-1-2 2-1.3.8-2.3 2.4.3L12 3.5Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
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
      className={`relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] shadow-[0_18px_50px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[24px] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.005))]" />
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
      <h2 className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</h2>
    </GlassCard>
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
    <input
      {...props}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
        color: "#ffffff",
        WebkitTextFillColor: "#ffffff",
        colorScheme: "dark",
        WebkitAppearance: "none",
        appearance: "none",
        ...style,
      }}
      className={`w-full rounded-[20px] border border-white/10 px-4 py-3 text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.12)] transition placeholder:text-zinc-500 focus:border-white/20 ${className}`}
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
          "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
        color: "#ffffff",
        WebkitTextFillColor: "#ffffff",
        colorScheme: "dark",
        WebkitAppearance: "none",
        appearance: "none",
        ...style,
      }}
      className={`w-full rounded-[20px] border border-white/10 px-4 py-3 text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.12)] transition focus:border-white/20 ${className}`}
    >
      {children}
    </select>
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
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{operation.client}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {formatDisplayDate(operation.date)}
          </p>
        </div>

        <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
          <p className="text-xs text-zinc-400">Получено</p>
          <p className="text-sm font-semibold text-white">
            {formatMoney(getPaymentsTotal(operation))}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-[18px] border border-white/8 bg-white/[0.035] p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Кто работал
          </p>
          <p className="text-sm text-white">{operation.owner}</p>
        </div>

        <div className="rounded-[18px] border border-white/8 bg-white/[0.035] p-3">
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
                <span className="font-medium whitespace-nowrap text-white">
                  {formatMoney(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border border-white/8 bg-white/[0.035] p-3">
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
                <span className="font-medium whitespace-nowrap text-white">
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
          className="flex-1 rounded-[16px] border border-white/10 bg-white/10 px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/15"
        >
          Редактировать
        </button>
        <button
          onClick={() => onDelete(operation.id)}
          className="flex-1 rounded-[16px] border border-red-400/10 bg-red-500/15 px-3 py-3 text-sm text-red-300 transition hover:bg-red-500/25"
        >
          Удалить
        </button>
      </div>
    </GlassCard>
  )
}

function BottomNav({
  activeTab,
  onChange,
  onAdd,
  hidden = false,
}: {
  activeTab: "dashboard" | "operations" | "analytics" | "settings"
  onChange: (tab: "dashboard" | "operations" | "analytics" | "settings") => void
  onAdd: () => void
  hidden?: boolean
}) {
  if (hidden) return null

  const itemClass = (tab: "dashboard" | "operations" | "analytics" | "settings") =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[11px] transition ${
      activeTab === tab ? "text-white" : "text-zinc-400 hover:text-white"
    }`

  const scrollToSection = (
    id: string,
    tab: "dashboard" | "operations" | "analytics" | "settings"
  ) => {
    onChange(tab)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-[600] flex justify-center md:hidden">
      <div className="pointer-events-auto mx-4 flex w-full max-w-[390px] items-center gap-2 rounded-[30px] border border-white/10 bg-[rgba(13,16,24,0.62)] px-3 py-2 shadow-[0_24px_70px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[24px]">
        <button
          className={itemClass("dashboard")}
          onClick={() => scrollToSection("dashboard-section", "dashboard")}
        >
          <HomeIcon />
          <span>Главная</span>
        </button>

        <button
          className={itemClass("operations")}
          onClick={() => scrollToSection("operations-section", "operations")}
        >
          <ReceiptIcon />
          <span>Операции</span>
        </button>

        <button
          onClick={onAdd}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#7d8dff,#4d65f6)] text-white shadow-[0_18px_38px_rgba(79,101,255,0.42),inset_0_1px_0_rgba(255,255,255,0.25)]"
        >
          <PlusIcon />
        </button>

        <button
          className={itemClass("analytics")}
          onClick={() => scrollToSection("analytics-section", "analytics")}
        >
          <ChartIcon />
          <span>Аналитика</span>
        </button>

        <button
          className={itemClass("settings")}
          onClick={() => scrollToSection("settings-section", "settings")}
        >
          <SettingsIcon />
          <span>Ещё</span>
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

  const [activeTab, setActiveTab] = React.useState<
    "dashboard" | "operations" | "analytics" | "settings"
  >("dashboard")

  const resetForm = React.useCallback(() => {
    setClient("")
    setOwner("Азат")
    setOperationDate(formatInputDate(new Date()))
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
      id: Number(item.id),
      date: String(item.date),
      client: String(item.client || "Без клиента"),
      owner: (item.owner as Owner) || "Азат",
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

  React.useEffect(() => {
    if (operationDate === "") {
      setOperationDate(formatInputDate(new Date()))
    }
  }, [operationDate])

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
      const normalized = normalizeServiceRow(row)
      return sum + normalized.amount
    }, 0)
  }, [serviceRows])

  const currentPaymentsTotal = React.useMemo(() => {
    return paymentRows.reduce((sum, row) => {
      const normalized = normalizePaymentRow(row)
      return sum + normalized.amount
    }, 0)
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
        id: Number(data.id),
        date: String(data.date),
        client: String(data.client),
        owner: data.owner as Owner,
        services: normalizeServices(data.services),
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
        id: Number(data.id),
        date: String(data.date),
        client: String(data.client),
        owner: data.owner as Owner,
        services: normalizeServices(data.services),
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
      id: Number(data.id),
      date: String(data.date),
      client: String(data.client),
      owner: data.owner as Owner,
      services: normalizeServices(data.services),
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
    <div className="min-h-screen bg-[#070a11] pb-28 text-white md:pb-0">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(77,101,246,0.25),transparent_24%),radial-gradient(circle_at_top_right,rgba(39,197,255,0.14),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(140,90,255,0.12),transparent_24%)]" />

      <div className="relative z-[1] flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-r border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.22)] backdrop-blur-[26px] lg:w-[290px] lg:p-6">
          <div className="mb-8">
            <div className="w-[86px] shrink-0">
              <img
                src={logoWhite}
                alt="logo"
                className="block h-auto w-full object-contain opacity-95"
              />
            </div>
          </div>

          <div className="hidden md:block">
            <button
              onClick={openCreateModal}
              className="w-full rounded-[22px] bg-[linear-gradient(180deg,#6d84ff,#4c63f0)] px-4 py-4 text-base font-semibold text-white shadow-[0_18px_38px_rgba(79,101,255,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:-translate-y-[1px]"
            >
              + Добавить операцию
            </button>

            <button
              onClick={() => void createNewMonth()}
              className="mt-3 w-full rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] px-4 py-4 text-base font-semibold text-white transition hover:bg-white/[0.08]"
            >
              + Новый месяц
            </button>

            <button
              onClick={() => void deleteSelectedMonth()}
              className="mt-3 w-full rounded-[22px] border border-red-300/10 bg-[linear-gradient(180deg,rgba(255,80,110,0.16),rgba(255,80,110,0.08))] px-4 py-4 text-base font-semibold text-red-200 transition hover:bg-red-500/15"
            >
              − Удалить месяц
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
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
          <section id="dashboard-section">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {normalizedMonths.map((monthKey) => (
                <button
                  key={monthKey}
                  onClick={() => setSelectedMonth(monthKey)}
                  className={`rounded-[18px] px-4 py-2.5 text-sm font-medium capitalize transition ${
                    selectedMonth === monthKey
                      ? "border border-white/10 bg-white/[0.14] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                      : "border border-white/8 bg-white/[0.045] text-zinc-300 hover:bg-white/[0.08]"
                  }`}
                >
                  {formatMonthLabel(monthKey)}
                </button>
              ))}
            </div>

            <GlassCard className="mb-6 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <p className="text-sm text-zinc-400">Цель выбранного месяца</p>
                <TextInput
                  type="number"
                  value={monthGoal}
                  onChange={(e) => void updateMonthGoal(e.target.value)}
                  className="w-full sm:w-[220px]"
                />
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Доход"
                value={formatMoney(monthIncome)}
                valueClassName="text-green-400"
              />
              <SummaryCard label="Аренда" value={formatMoney(RENT_GOAL)} />
              <SummaryCard
                label="Осталось до аренды"
                value={formatMoney(leftToRent)}
                valueClassName="text-yellow-300"
              />
              <SummaryCard
                label="Чистая прибыль после аренды"
                value={formatMoney(profitAfterRent)}
                valueClassName={profitAfterRent >= 0 ? "text-green-400" : "text-red-400"}
              />
            </div>
          </section>

          <section id="analytics-section" className="mt-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
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
                          className="rounded-[18px] border border-white/8 bg-white/[0.05] p-3"
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
                          className="flex items-center justify-between gap-4 rounded-[18px] border border-white/8 bg-white/[0.05] p-3"
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
                        className="flex items-center justify-between gap-4 rounded-[18px] border border-white/8 bg-white/[0.05] p-3"
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
          </section>

          <section id="operations-section" className="mt-6">
            <GlassCard className="p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xl font-semibold">История операций</p>
                  <p className="text-sm text-zinc-400">Все операции выбранного месяца</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={openCreateModal}
                    className="rounded-[18px] bg-[linear-gradient(180deg,#6d84ff,#4c63f0)] px-4 py-2 text-sm font-medium text-white shadow-[0_14px_30px_rgba(79,101,255,0.28)] md:hidden"
                  >
                    + Операция
                  </button>

                  {lastAdded && (
                    <button
                      onClick={() => void undoAdd()}
                      className="rounded-[16px] border border-yellow-300/10 bg-yellow-500/15 px-4 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/25"
                    >
                      Отменить добавление
                    </button>
                  )}

                  {lastDeleted && (
                    <button
                      onClick={() => void undoDelete()}
                      className="rounded-[16px] border border-yellow-300/10 bg-yellow-500/15 px-4 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/25"
                    >
                      Отменить удаление
                    </button>
                  )}
                </div>
              </div>

              {sortedSelectedMonthOperations.length === 0 ? (
                <div className="rounded-[28px] border border-white/8 bg-white/[0.03] py-14 text-center text-zinc-400">
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

                  <div className="hidden overflow-x-auto rounded-[28px] border border-white/8 bg-white/[0.025] md:block">
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
                                    {service.type === "Запись"
                                      ? ` — ${service.hours} ч`
                                      : ""}{" "}
                                    — {formatMoney(service.amount)}
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
                                  className="rounded-[14px] border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/15"
                                >
                                  Редактировать
                                </button>
                                <button
                                  onClick={() => void deleteOperation(operation.id)}
                                  className="rounded-[14px] border border-red-300/10 bg-red-500/15 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/25"
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
          </section>

          <section id="settings-section" className="mt-6">
            <div className="grid gap-6">
              <GlassCard className="p-6">
                <p className="text-xl font-semibold">Быстрые действия</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={openCreateModal}
                    className="rounded-[20px] bg-[linear-gradient(180deg,#6d84ff,#4c63f0)] px-4 py-4 text-left font-semibold text-white shadow-[0_14px_30px_rgba(79,101,255,0.28)]"
                  >
                    + Добавить операцию
                  </button>

                  <button
                    onClick={() => void createNewMonth()}
                    className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] px-4 py-4 text-left font-semibold text-white"
                  >
                    + Создать новый месяц
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("analytics")
                      const el = document.getElementById("analytics-section")
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
                    }}
                    className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] px-4 py-4 text-left font-semibold text-white"
                  >
                    Открыть аналитику
                  </button>

                  <button
                    onClick={() => void deleteSelectedMonth()}
                    className="rounded-[20px] border border-red-300/10 bg-[linear-gradient(180deg,rgba(255,80,110,0.16),rgba(255,80,110,0.08))] px-4 py-4 text-left font-semibold text-red-200"
                  >
                    Удалить выбранный месяц
                  </button>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <p className="text-xl font-semibold">Сводка</p>
                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  <p>Месяц: {formatMonthLabel(selectedMonth)}</p>
                  <p>Операций: {sortedSelectedMonthOperations.length}</p>
                  <p>Доход: {formatMoney(monthIncome)}</p>
                  <p>Цель: {formatMoney(monthGoal)}</p>
                </div>
              </GlassCard>
            </div>
          </section>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(5,5,9,0.74)] p-2 sm:p-4 backdrop-blur-[14px]">
          <div className="relative w-full max-w-[98vw] rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(34,34,40,0.98),rgba(16,16,20,0.98))] shadow-[0_36px_90px_rgba(0,0,0,0.64),inset_0_1px_0_rgba(255,255,255,0.08)] sm:max-w-[95vw] lg:max-w-[900px]">
            <div className="max-h-[92vh] overflow-y-auto px-4 pb-6 pt-5 sm:px-6 sm:pt-6">
              <div className="mb-5">
                <h2 className="text-2xl font-bold">
                  {editingOperationId ? "Редактировать операцию" : "Добавить операцию"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Один клиент может взять несколько услуг сразу
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>Клиент</FieldLabel>
                  <TextInput
                    placeholder="Клиент"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel>Дата</FieldLabel>
                  <TextInput
                    type="date"
                    value={operationDate}
                    onChange={(e) => setOperationDate(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel>Кто работал</FieldLabel>
                  <SelectInput
                    value={owner}
                    onChange={(e) => setOwner(e.target.value as Owner)}
                  >
                    {ownerOptions.map((option) => (
                      <option key={option} value={option} className="bg-[#151823]">
                        {option}
                      </option>
                    ))}
                  </SelectInput>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                <div>
                  <p className="text-lg font-semibold">Услуги</p>
                </div>

                {serviceRows.map((row, index) => (
                  <GlassCard key={row.id} className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-semibold">Услуга {index + 1}</p>
                      {serviceRows.length > 1 && (
                        <button
                          onClick={() => removeServiceRow(row.id)}
                          className="text-sm text-red-400 transition hover:text-red-300"
                        >
                          Удалить услугу
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <FieldLabel>Тип услуги</FieldLabel>
                        <SelectInput
                          value={row.type}
                          onChange={(e) => {
                            const selectedType = e.target.value as ServiceType
                            updateServiceRow(row.id, {
                              type: selectedType,
                              hours: selectedType === "Запись" ? row.hours || 1 : 0,
                              amount:
                                selectedType === "Запись"
                                  ? (row.hours || 1) * 1000
                                  : row.amount,
                            })
                          }}
                        >
                          {serviceOptions.map((option) => (
                            <option key={option} value={option} className="bg-[#151823]">
                              {option}
                            </option>
                          ))}
                        </SelectInput>
                      </div>

                      <div>
                        <FieldLabel>
                          {row.type === "Запись" ? "Часы" : "Сумма"}
                        </FieldLabel>
                        {row.type === "Запись" ? (
                          <TextInput
                            type="number"
                            min={1}
                            value={String(row.hours)}
                            onChange={(e) =>
                              updateServiceRow(row.id, {
                                hours: Number(e.target.value) || 1,
                              })
                            }
                          />
                        ) : (
                          <TextInput
                            type="number"
                            min={0}
                            value={row.amount === 0 ? "" : String(row.amount)}
                            onChange={(e) =>
                              updateServiceRow(row.id, {
                                amount: Number(e.target.value) || 0,
                              })
                            }
                            placeholder="Сумма"
                          />
                        )}
                      </div>

                      <div>
                        <FieldLabel>Итог</FieldLabel>
                        <div className="flex min-h-[52px] items-center rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] px-4 py-3 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.12)]">
                          {formatMoney(
                            row.type === "Запись" ? row.hours * 1000 : row.amount
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}

                <button
                  onClick={addServiceRow}
                  className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] px-4 py-3 text-sm font-medium text-white shadow-[0_12px_26px_rgba(0,0,0,0.16)] transition hover:bg-white/[0.08]"
                >
                  + Добавить услугу
                </button>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <p className="text-lg font-semibold">Оплата</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Для Онлайн сумма всегда фиксированная: {formatMoney(ONLINE_NET_AMOUNT)}
                  </p>
                </div>

                {paymentRows.map((row, index) => (
                  <GlassCard key={row.id} className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-semibold">Оплата {index + 1}</p>
                      {paymentRows.length > 1 && (
                        <button
                          onClick={() => removePaymentRow(row.id)}
                          className="text-sm text-red-400 transition hover:text-red-300"
                        >
                          Удалить оплату
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <FieldLabel>Тип оплаты</FieldLabel>
                        <SelectInput
                          value={row.type}
                          onChange={(e) => {
                            const selectedType = e.target.value as PaymentType
                            updatePaymentRow(row.id, {
                              type: selectedType,
                              amount:
                                selectedType === "Онлайн"
                                  ? ONLINE_NET_AMOUNT
                                  : row.amount,
                            })
                          }}
                        >
                          {paymentOptions.map((option) => (
                            <option key={option} value={option} className="bg-[#151823]">
                              {option}
                            </option>
                          ))}
                        </SelectInput>
                      </div>

                      <div>
                        <FieldLabel>Сумма</FieldLabel>
                        {row.type === "Онлайн" ? (
                          <div className="flex min-h-[52px] items-center rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] px-4 py-3 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.12)]">
                            {formatMoney(ONLINE_NET_AMOUNT)}
                          </div>
                        ) : (
                          <TextInput
                            type="number"
                            min={0}
                            value={row.amount === 0 ? "" : String(row.amount)}
                            onChange={(e) =>
                              updatePaymentRow(row.id, {
                                amount: Number(e.target.value) || 0,
                              })
                            }
                            placeholder="Сумма оплаты"
                          />
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}

                <button
                  onClick={addPaymentRow}
                  className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] px-4 py-3 text-sm font-medium text-white shadow-[0_12px_26px_rgba(0,0,0,0.16)] transition hover:bg-white/[0.08]"
                >
                  + Добавить оплату
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <GlassCard className="p-4">
                  <p className="text-sm text-zinc-400">Итог по услугам</p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatMoney(currentServicesTotal)}
                  </p>
                </GlassCard>

                <GlassCard className="p-4">
                  <p className="text-sm text-zinc-400">Получено оплатой</p>
                  <p className="mt-2 text-2xl font-bold text-green-400">
                    {formatMoney(currentPaymentsTotal)}
                  </p>
                </GlassCard>
              </div>

              {currentPaymentsTotal !== currentServicesTotal && (
                <div className="mt-4 rounded-[22px] border border-yellow-300/10 bg-[linear-gradient(180deg,rgba(120,92,18,0.22),rgba(120,92,18,0.14))] p-4 text-sm text-yellow-100 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                  Внимание: сумма оплат и сумма услуг не совпадают. Это нормально,
                  если внесена только предоплата или оплата частями.
                </div>
              )}

              <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <GlassCard className="ml-0 w-full max-w-[260px] p-4">
                  <p className="text-sm text-zinc-400">Фактически получено</p>
                  <p className="mt-2 text-3xl font-bold">{formatMoney(currentPaymentsTotal)}</p>
                </GlassCard>

                <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="w-full rounded-[18px] px-4 py-3 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white sm:w-auto"
                  >
                    Отмена
                  </button>

                  <button
                    onClick={() => void saveOperation()}
                    className="w-full rounded-[22px] bg-[linear-gradient(180deg,#2fd06e,#1ba455)] px-6 py-3 font-semibold text-white shadow-[0_16px_32px_rgba(27,164,85,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:brightness-110 sm:w-auto"
                  >
                    {editingOperationId ? "Сохранить изменения" : "Сохранить"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        onAdd={openCreateModal}
        hidden={showModal}
      />
    </div>
  )
}