import React from "react"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "../components/icons"
import {
  GlassCard,
  IconButton,
  PrimaryButton,
  SectionTitle,
} from "../components/ui"

import { cn } from "../utils/cn"
import { formatDisplayDate } from "../lib/dates"
import { formatMoney } from "../lib/money"
import {
  formatStatusLabel,
  getStatusPillClass,
} from "../utils/appointments"
import {
  getPaymentsTotal,
  getServicesTotal,
} from "../lib/calculations"

import type { Appointment, ShiftDay } from "../types/app"

type ScheduleSectionProps = {
  selectedDate: string
  setSelectedDate: (value: string) => void
  shiftSelectedDate: (direction: -1 | 1) => void
  selectedDateShift?: ShiftDay
  selectedDateAppointments: Appointment[]
  toggleShift: (owner: "azat" | "mars") => void | Promise<void>
  openEditAppointmentModal: (appointment: Appointment) => void
  openCreateAppointmentModal: () => void
  NativeDateButton: React.ComponentType<{
    value: string
    onChange: (value: string) => void
  }>
  fontBaseStyle: React.CSSProperties
  fontDisplayHeroStyle: React.CSSProperties
  fontDisplayTitleStyle: React.CSSProperties
  fontDisplayMediumStyle: React.CSSProperties
  fontBodyMediumStyle: React.CSSProperties
  fontLabelStyle: React.CSSProperties
  fontCapsStyle: React.CSSProperties
}

export default function ScheduleSection({
  selectedDate,
  setSelectedDate,
  shiftSelectedDate,
  selectedDateShift,
  selectedDateAppointments,
  toggleShift,
  openEditAppointmentModal,
  openCreateAppointmentModal,
  NativeDateButton,
  fontBaseStyle,
  fontDisplayHeroStyle,
  fontDisplayTitleStyle,
  fontDisplayMediumStyle,
  fontBodyMediumStyle,
  fontLabelStyle,
  fontCapsStyle,
}: ScheduleSectionProps) {
  return (
    <>
      <SectionTitle
        title="График"
        subtitle="Записи на выбранную дату с быстрым переходом в карточку клиента."
        action={
          <PrimaryButton
            onClick={openCreateAppointmentModal}
            style={fontDisplayMediumStyle}
          >
            <PlusIcon />
            Запись
          </PrimaryButton>
        }
        fonts={{
          fontBaseStyle,
          fontDisplayHeroStyle,
          fontDisplayTitleStyle,
          fontDisplayMediumStyle,
          fontBodyMediumStyle,
          fontLabelStyle,
          fontCapsStyle,
        }}
      />

      <GlassCard className="mb-4 p-3.5 sm:p-4" fontBaseStyle={fontBaseStyle}>
        <div className="flex items-center gap-2">
          <IconButton onClick={() => shiftSelectedDate(-1)} style={fontBaseStyle}>
            <ChevronLeftIcon />
          </IconButton>

          <div className="min-w-0 flex-1">
            <NativeDateButton value={selectedDate} onChange={setSelectedDate} />
          </div>

          <IconButton onClick={() => shiftSelectedDate(1)} style={fontBaseStyle}>
            <ChevronRightIcon />
          </IconButton>
        </div>
      </GlassCard>

      <GlassCard className="mb-4 p-4 sm:p-5" fontBaseStyle={fontBaseStyle}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[#8b97b5]" style={fontBodyMediumStyle}>
              Кто сегодня работает
            </p>
            <p className="mt-1 text-white" style={fontDisplayMediumStyle}>
              {formatDisplayDate(selectedDate)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void toggleShift("azat")}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                selectedDateShift?.azat
                  ? "bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/20"
                  : "bg-white/[0.05] text-white"
              )}
              style={fontDisplayMediumStyle}
            >
              Азат
            </button>

            <button
              type="button"
              onClick={() => void toggleShift("mars")}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                selectedDateShift?.mars
                  ? "bg-violet-400/20 text-violet-200 ring-1 ring-violet-300/20"
                  : "bg-white/[0.05] text-white"
              )}
              style={fontDisplayMediumStyle}
            >
              Марс
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {selectedDateAppointments.map((appointment) => {
          const total = getServicesTotal(appointment)
          const paid = getPaymentsTotal(appointment)

          return (
            <button
              key={String(appointment.id)}
              onClick={() => openEditAppointmentModal(appointment)}
              className="schedule-card"
              style={fontBaseStyle}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[11px] text-[#97a3c5]"
                      style={fontBodyMediumStyle}
                    >
                      {appointment.startTime} — {appointment.endTime}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px]",
                        getStatusPillClass(appointment.status)
                      )}
                      style={fontDisplayMediumStyle}
                    >
                      {formatStatusLabel(appointment.status)}
                    </span>
                  </div>

                  <p
                    className="mt-4 truncate text-[22px] text-white"
                    style={fontDisplayMediumStyle}
                  >
                    {appointment.client}
                  </p>

                  <div
                    className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#8794b5]"
                    style={fontBodyMediumStyle}
                  >
                    <span>{appointment.owner}</span>
                    {appointment.phone ? <span>· {appointment.phone}</span> : null}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[22px] text-white" style={fontDisplayMediumStyle}>
                    {formatMoney(paid)}
                  </p>
                  <p className="mt-1 text-xs text-[#7581a3]" style={fontBodyMediumStyle}>
                    из {formatMoney(total)}
                  </p>
                </div>
              </div>
            </button>
          )
        })}

        {selectedDateAppointments.length === 0 && (
          <GlassCard className="p-6" fontBaseStyle={fontBaseStyle}>
            <p className="text-[18px] text-white" style={fontDisplayMediumStyle}>
              На эту дату записей нет
            </p>
            <p className="mt-2 text-sm text-[#8b97b5]" style={fontBodyMediumStyle}>
              Добавь новую запись через кнопку сверху или через центральную кнопку внизу.
            </p>
          </GlassCard>
        )}
      </div>
    </>
  )
}