import React from "react"

import { PlusIcon } from "../components/icons"
import {
  GlassCard,
  MonthTabs,
  PrimaryButton,
  ProgressLine,
  SectionTitle,
  StatMini,
} from "../components/ui"

import { formatMoney } from "../lib/money"
import { RENT_GOAL } from "../constants/app"

type DashboardSectionProps = {
  normalizedMonths: string[]
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  openCreateAppointmentModal: () => void

  monthIncome: number
  monthGoal: number
  leftToMonthGoal: number
  leftToRent: number
  azatIncome: number
  marsIncome: number
  profitAfterRent: number

  topClient: [string, number] | null
  serviceRevenueRows: [string, number][]
  selectedMonthEntries: unknown[]

  DashboardHero: React.ComponentType<{
    selectedMonth: string
    monthIncome: number
    monthGoal: number
    leftToMonthGoal: number
    leftToRent: number
    azatIncome: number
    marsIncome: number
    profitAfterRent: number
  }>

  fontBaseStyle: React.CSSProperties
  fontDisplayHeroStyle: React.CSSProperties
  fontDisplayTitleStyle: React.CSSProperties
  fontDisplayMediumStyle: React.CSSProperties
  fontBodyMediumStyle: React.CSSProperties
  fontLabelStyle: React.CSSProperties
  fontCapsStyle: React.CSSProperties
}

export default function DashboardSection({
  normalizedMonths,
  selectedMonth,
  setSelectedMonth,
  openCreateAppointmentModal,
  monthIncome,
  monthGoal,
  leftToMonthGoal,
  leftToRent,
  azatIncome,
  marsIncome,
  profitAfterRent,
  topClient,
  serviceRevenueRows,
  selectedMonthEntries,
  DashboardHero,
  fontBaseStyle,
  fontDisplayHeroStyle,
  fontDisplayTitleStyle,
  fontDisplayMediumStyle,
  fontBodyMediumStyle,
  fontLabelStyle,
  fontCapsStyle,
}: DashboardSectionProps) {
  return (
    <>
      <SectionTitle
        title="Главная"
        subtitle="Центр управления студией: доход, план, лидеры месяца и ключевые точки роста."
        action={
          <PrimaryButton
            onClick={openCreateAppointmentModal}
            className="hidden sm:inline-flex"
            style={fontDisplayMediumStyle}
          >
            <PlusIcon />
            Новая запись
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

      <MonthTabs
        months={normalizedMonths}
        selectedMonth={selectedMonth}
        onChange={setSelectedMonth}
        fontDisplayMediumStyle={fontDisplayMediumStyle}
      />

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <DashboardHero
          selectedMonth={selectedMonth}
          monthIncome={monthIncome}
          monthGoal={monthGoal}
          leftToMonthGoal={leftToMonthGoal}
          leftToRent={leftToRent}
          azatIncome={azatIncome}
          marsIncome={marsIncome}
          profitAfterRent={profitAfterRent}
        />

        <div className="grid gap-4">
          <StatMini
            label="Осталось до цели"
            value={formatMoney(leftToMonthGoal)}
            sub="Сколько не хватает до плана"
            fontCapsStyle={fontCapsStyle}
            fontDisplayTitleStyle={fontDisplayTitleStyle}
            fontBodyMediumStyle={fontBodyMediumStyle}
            fontBaseStyle={fontBaseStyle}
          />
          <StatMini
            label="Лучший клиент"
            value={topClient ? topClient[0] : "Нет данных"}
            sub={topClient ? formatMoney(topClient[1]) : "Пока нет лидера"}
            fontCapsStyle={fontCapsStyle}
            fontDisplayTitleStyle={fontDisplayTitleStyle}
            fontBodyMediumStyle={fontBodyMediumStyle}
            fontBaseStyle={fontBaseStyle}
          />
          <GlassCard className="p-5" fontBaseStyle={fontBaseStyle}>
            <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
              Топ услуг
            </p>
            <div className="mt-4 space-y-3">
              {serviceRevenueRows.length > 0 ? (
                serviceRevenueRows.slice(0, 4).map(([service, amount], index) => (
                  <div key={service} className="metric-row">
                    <div className="flex items-center gap-3">
                      <span className="metric-dot">{index + 1}</span>
                      <span className="text-sm text-white" style={fontBodyMediumStyle}>
                        {service}
                      </span>
                    </div>
                    <span className="text-sm text-white" style={fontDisplayMediumStyle}>
                      {formatMoney(amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#8b97b5]" style={fontBodyMediumStyle}>
                  Пока нет данных
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <GlassCard className="p-5" fontBaseStyle={fontBaseStyle}>
          <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
            План / аренда
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-sm text-[#9cabcd]" style={fontBodyMediumStyle}>
                  План
                </span>
                <span className="text-sm text-white" style={fontDisplayMediumStyle}>
                  {formatMoney(monthGoal)}
                </span>
              </div>
              <ProgressLine
                value={monthIncome}
                total={monthGoal}
                colorClassName="from-[#86dcff] via-[#6493ff] to-[#7a69ff]"
                heightClassName="h-[9px]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-sm text-[#9cabcd]" style={fontBodyMediumStyle}>
                  Аренда
                </span>
                <span className="text-sm text-white" style={fontDisplayMediumStyle}>
                  {formatMoney(RENT_GOAL)}
                </span>
              </div>
              <ProgressLine
                value={monthIncome}
                total={RENT_GOAL}
                colorClassName="from-[#67ffe0] via-[#58b9ff] to-[#5f85ff]"
                heightClassName="h-[9px]"
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5" fontBaseStyle={fontBaseStyle}>
          <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
            Доходы по владельцам
          </p>
          <div className="mt-4 space-y-4">
            <div className="owner-inline">
              <span className="text-sm text-white" style={fontBodyMediumStyle}>
                Азат
              </span>
              <span className="text-sm text-white" style={fontDisplayMediumStyle}>
                {formatMoney(azatIncome)}
              </span>
            </div>
            <div className="owner-inline">
              <span className="text-sm text-white" style={fontBodyMediumStyle}>
                Марс
              </span>
              <span className="text-sm text-white" style={fontDisplayMediumStyle}>
                {formatMoney(marsIncome)}
              </span>
            </div>
          </div>
        </GlassCard>

        <StatMini
          label="Чистая прибыль"
          value={formatMoney(profitAfterRent)}
          sub="Доход минус аренда"
          accent={profitAfterRent >= 0 ? "good" : "danger"}
          fontCapsStyle={fontCapsStyle}
          fontDisplayTitleStyle={fontDisplayTitleStyle}
          fontBodyMediumStyle={fontBodyMediumStyle}
          fontBaseStyle={fontBaseStyle}
        />

        <GlassCard className="p-5" fontBaseStyle={fontBaseStyle}>
          <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
            Записей в месяце
          </p>
          <p className="mt-4 text-[34px] text-white" style={fontDisplayTitleStyle}>
            {selectedMonthEntries.length}
          </p>
          <p className="mt-2 text-sm text-[#8f98b3]" style={fontBodyMediumStyle}>
            Все операции и записи, попавшие в выбранный месяц.
          </p>
        </GlassCard>
      </div>
    </>
  )
}