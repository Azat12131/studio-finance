import type { Appointment, FinancialEntry, PaymentItem, ServiceItem, ServiceType } from "../types/app"

export function getPaymentsTotal(entry: { payments: PaymentItem[] }) {
  return entry.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

export function getServicesTotal(entry: { services: ServiceItem[] }) {
  return entry.services.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

export function getServiceRevenueMap(entries: FinancialEntry[]) {
  const map = new Map<ServiceType, number>()

  entries.forEach((entry) => {
    entry.services.forEach((service) => {
      map.set(service.type, (map.get(service.type) || 0) + Number(service.amount || 0))
    })
  })

  return map
}

export function appointmentToFinancialEntry(appointment: Appointment): FinancialEntry {
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

export function getProgressWidth(value: number, total: number) {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}