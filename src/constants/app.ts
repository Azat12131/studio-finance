import type { PaymentType, ServiceType } from "../types/app"

export const RENT_GOAL = 20000
export const DEFAULT_MONTH_GOAL = 50000

export const serviceOptions: ServiceType[] = [
  "Запись",
  "Сведение",
  "Дистрибуция",
  "Мастеринг",
  "Другое",
]

export const paymentOptions: PaymentType[] = ["Нал", "Карта"]

export const timeMinutePresets = ["00", "15", "30", "45"] as const