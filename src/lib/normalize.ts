import type {
  PaymentItem,
  PaymentType,
  ServiceItem,
  ServiceType,
} from "../types/app"
import { makeId } from "./ids"

export function makeServiceRow(type: ServiceType = "Запись"): ServiceItem {
  return {
    id: makeId(),
    type,
    hours: type === "Запись" ? 1 : "",
    amount: type === "Запись" ? 1000 : 0,
  }
}

export function makePaymentRow(type: PaymentType = "Нал"): PaymentItem {
  return {
    id: makeId(),
    type,
    amount: 0,
  }
}

export function normalizeServiceRow(row: ServiceItem): ServiceItem {
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

export function normalizePaymentRow(row: PaymentItem): PaymentItem {
  return {
    ...row,
    amount: Number(row.amount) || 0,
  }
}

export function normalizePayments(rawPayments: unknown): PaymentItem[] {
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

export function normalizeServices(rawServices: unknown): ServiceItem[] {
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