import type {
  Owner,
  ServiceType,
  PaymentType,
  AppointmentStatus,
} from "../types/app"

export const RENT_GOAL = 20000
export const DEFAULT_MONTH_GOAL = 50000

export const ownerOptions: Owner[] = ["Азат", "Марс"]

export const serviceOptions: ServiceType[] = [
  "Запись",
  "Сведение",
  "Дистрибуция",
  "Мастеринг",
  "Другое",
]

export const paymentOptions: PaymentType[] = ["Нал", "Карта"]

export const appointmentStatusOptions: AppointmentStatus[] = [
  "Ожидание",
  "Подтвердил",
  "Пришел",
  "Не пришел",
]