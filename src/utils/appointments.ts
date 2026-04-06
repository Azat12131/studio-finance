import type {
  Appointment,
  AppointmentDraft,
  AppointmentStatus,
  Owner,
} from "../types/app"
import { formatInputDate } from "./date"
import { makePaymentRow, makeServiceRow } from "./normalize"
import { makeId } from "./id"

export function buildDefaultAppointmentDraft(selectedDate?: string): AppointmentDraft {
  const today = formatInputDate(new Date())

  return {
    client: "",
    phone: "",
    owner: "Азат",
    status: "Ожидание",
    date: selectedDate || today,
    startTime: "14:00",
    endTime: "15:00",
    note: "",
    services: [makeServiceRow()],
    payments: [makePaymentRow("Нал")],
  }
}

export function appointmentToDraft(appointment: Appointment): AppointmentDraft {
  return {
    client: appointment.client,
    phone: appointment.phone,
    owner: appointment.owner,
    status: appointment.status,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    note: appointment.note,
    services:
      appointment.services.length > 0
        ? appointment.services.map((service) => ({
            ...service,
            id: service.id || makeId(),
            hours:
              service.type === "Запись"
                ? Number(service.hours) > 0
                  ? Number(service.hours)
                  : 1
                : "",
          }))
        : [makeServiceRow()],
    payments:
      appointment.payments.length > 0
        ? appointment.payments.map((payment) => ({
            ...payment,
            id: payment.id || makeId(),
            amount: Number(payment.amount) || 0,
          }))
        : [makePaymentRow("Нал")],
  }
}

export function getStatusPillClass(status: AppointmentStatus) {
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

export function formatStatusLabel(status: AppointmentStatus) {
  if (status === "Пришел") return "Пришёл"
  if (status === "Не пришел") return "Не пришёл"
  return status
}

export function getOwnerGlow(owner: Owner) {
  return owner === "Азат"
    ? "from-[#8be4ff] via-[#5f96ff] to-[#7d6bff]"
    : "from-[#7dd3fc] via-[#6d78ff] to-[#b16dff]"
}