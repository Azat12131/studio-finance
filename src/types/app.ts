export type Owner = "Азат" | "Марс"
export type PaymentType = "Нал" | "Карта"

export type ServiceType =
  | "Запись"
  | "Сведение"
  | "Дистрибуция"
  | "Мастеринг"
  | "Другое"

export type AppointmentStatus =
  | "Ожидание"
  | "Подтвердил"
  | "Пришел"
  | "Не пришел"

export type ServiceItem = {
  id: number
  type: ServiceType
  hours: number | ""
  amount: number
}

export type PaymentItem = {
  id: number
  type: PaymentType
  amount: number
}

export type Operation = {
  id: number
  date: string
  client: string
  owner: Owner
  services: ServiceItem[]
  payments: PaymentItem[]
}

export type Appointment = {
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

export type FinancialEntry = {
  id: number
  source: "operation" | "appointment"
  date: string
  client: string
  owner: Owner
  services: ServiceItem[]
  payments: PaymentItem[]
}

export type MonthGoals = Record<string, number>
export type AppTab = "dashboard" | "schedule" | "operations" | "analytics" | "settings"