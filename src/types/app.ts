export type EntityId = string | number

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
  id: EntityId
  date: string
  client: string
  owner: Owner
  services: ServiceItem[]
  payments: PaymentItem[]
}

export type Appointment = {
  id: EntityId
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

export type ShiftDay = {
  id: EntityId
  date: string
  azat: boolean
  mars: boolean
  note: string
}

export type FinancialEntry = {
  id: EntityId
  source: "operation" | "appointment"
  date: string
  startTime?: string
  endTime?: string
  client: string
  owner: Owner
  services: ServiceItem[]
  payments: PaymentItem[]
}

export type MonthGoals = Record<string, number>

export type AppTab =
  | "dashboard"
  | "schedule"
  | "operations"
  | "analytics"
  | "settings"

export type TimePickerTarget = "start" | "end" | null

export type AppointmentDraft = {
  client: string
  phone: string
  owner: Owner
  status: AppointmentStatus
  date: string
  startTime: string
  endTime: string
  note: string
  services: ServiceItem[]
  payments: PaymentItem[]
}