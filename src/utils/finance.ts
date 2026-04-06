import type {
  Appointment,
  FinancialEntry,
  PaymentItem,
  PaymentType,
  ServiceType,
} from "../types/app"

export function getPaymentsTotal(entry: { payments: PaymentItem[] }) {
  return entry.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

export function getServicesTotal(entry: { payments?: PaymentItem[]; services: { amount: number }[] }) {
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
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    client: appointment.client,
    owner: appointment.owner,
    services: appointment.services,
    payments: appointment.payments,
  }
}

export function getEntryServiceLabel(entry: Pick<FinancialEntry, "services">) {
  if (!entry.services.length) return "Без услуг"

  if (entry.services.length === 1) {
    return entry.services[0].type
  }

  const uniqueTypes = Array.from(new Set(entry.services.map((service) => service.type)))

  if (uniqueTypes.length === 1) {
    return `${uniqueTypes[0]} · ${entry.services.length} усл.`
  }

  return `${entry.services[0].type} · ${entry.services.length} усл.`
}

export function getPaymentTypeTotal(entries: FinancialEntry[], type: PaymentType) {
  return entries.reduce((sum, entry) => {
    const entryTotal = entry.payments
      .filter((payment) => payment.type === type)
      .reduce((innerSum, payment) => innerSum + Number(payment.amount || 0), 0)

    return sum + entryTotal
  }, 0)
}

export function getProgressWidth(value: number, total: number) {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}