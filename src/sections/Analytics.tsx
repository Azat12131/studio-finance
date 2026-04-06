import React from "react"
import type { ChartOptions } from "chart.js"
import { Bar } from "react-chartjs-2"

import { GlassCard, MonthTabs, SectionTitle } from "../components/ui"
import { formatDisplayDate, formatMonthLabel } from "../lib/dates"
import { formatMoney } from "../lib/money"

type DailyStatItem = {
  day: number
  amount: number
  dateKey: string
}

type DailyStats = {
  values: DailyStatItem[]
  colors: string[]
  bestDays: DailyStatItem[]
  weakDays: number
}

type AnalyticsSectionProps = {
  normalizedMonths: string[]
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  chartData: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor: string[]
      borderRadius: number
      barThickness: number
      borderSkipped: false
    }>
  }
  chartOptions: ChartOptions<"bar">
  dailyStats: DailyStats
  cashIncome: number
  cardIncome: number
  fontBaseStyle: React.CSSProperties
  fontDisplayHeroStyle: React.CSSProperties
  fontDisplayTitleStyle: React.CSSProperties
  fontDisplayMediumStyle: React.CSSProperties
  fontBodyMediumStyle: React.CSSProperties
  fontLabelStyle: React.CSSProperties
  fontCapsStyle: React.CSSProperties
}

export default function AnalyticsSection({
  normalizedMonths,
  selectedMonth,
  setSelectedMonth,
  chartData,
  chartOptions,
  dailyStats,
  cashIncome,
  cardIncome,
  fontBaseStyle,
  fontDisplayHeroStyle,
  fontDisplayTitleStyle,
  fontDisplayMediumStyle,
  fontBodyMediumStyle,
  fontLabelStyle,
  fontCapsStyle,
}: AnalyticsSectionProps) {
  return (
    <>
      <SectionTitle
        title="Аналитика"
        subtitle="Динамика выручки по дням и лучшие точки месяца."
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

      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <GlassCard className="p-5 sm:p-6" glow fontBaseStyle={fontBaseStyle}>
          <div className="mb-5">
            <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
              Выручка по дням
            </p>
            <p className="mt-2 text-[26px] text-white" style={fontDisplayMediumStyle}>
              {formatMonthLabel(selectedMonth)}
            </p>
          </div>
          <div className="h-[290px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </GlassCard>

        <div className="grid gap-4">
          <GlassCard className="p-5 sm:p-6" fontBaseStyle={fontBaseStyle}>
            <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
              Лучшие дни месяца
            </p>
            <div className="mt-4 space-y-3">
              {dailyStats.bestDays.length > 0 ? (
                dailyStats.bestDays.map((day, index) => (
                  <div key={day.dateKey} className="analytics-day-card">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-[#7f8aa8]" style={fontBodyMediumStyle}>
                          #{index + 1}
                        </p>
                        <p className="mt-1 text-sm text-white" style={fontDisplayMediumStyle}>
                          {formatDisplayDate(day.dateKey)}
                        </p>
                      </div>
                      <span className="text-sm text-white" style={fontDisplayMediumStyle}>
                        {formatMoney(day.amount)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#8b97b5]" style={fontBodyMediumStyle}>
                  Пока нет успешных дней
                </p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6" fontBaseStyle={fontBaseStyle}>
            <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
              Оплаты по типам
            </p>

            <div className="mt-4 grid gap-3">
              <div className="analytics-day-card">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-[#7f8aa8]" style={fontBodyMediumStyle}>
                      Наличные
                    </p>
                    <p className="mt-1 text-sm text-white" style={fontDisplayMediumStyle}>
                      Нал
                    </p>
                  </div>
                  <span className="text-sm text-white" style={fontDisplayMediumStyle}>
                    {formatMoney(cashIncome)}
                  </span>
                </div>
              </div>

              <div className="analytics-day-card">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-[#7f8aa8]" style={fontBodyMediumStyle}>
                      Безналичная оплата
                    </p>
                    <p className="mt-1 text-sm text-white" style={fontDisplayMediumStyle}>
                      Карта
                    </p>
                  </div>
                  <span className="text-sm text-white" style={fontDisplayMediumStyle}>
                    {formatMoney(cardIncome)}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6" fontBaseStyle={fontBaseStyle}>
            <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
              Слабые дни
            </p>
            <p className="mt-3 text-[34px] text-white" style={fontDisplayTitleStyle}>
              {dailyStats.weakDays}
            </p>
            <p className="mt-2 text-sm text-[#8b97b5]" style={fontBodyMediumStyle}>
              Дней без движения в выбранном месяце.
            </p>
          </GlassCard>
        </div>
      </div>
    </>
  )
}