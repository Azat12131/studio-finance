import React from "react"

import { GlassCard, MonthTabs, SectionTitle } from "../components/ui"

type OperationsSectionProps = {
  normalizedMonths: string[]
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  selectedMonthEntries: any[]
  openFinancialEntry: (entry: any) => void
  RecentOperationRow: React.ComponentType<{
    entry: any
    onOpen: (entry: any) => void
  }>
  fontBaseStyle: React.CSSProperties
  fontDisplayHeroStyle: React.CSSProperties
  fontDisplayTitleStyle: React.CSSProperties
  fontDisplayMediumStyle: React.CSSProperties
  fontBodyMediumStyle: React.CSSProperties
  fontLabelStyle: React.CSSProperties
  fontCapsStyle: React.CSSProperties
}

export default function OperationsSection({
  normalizedMonths,
  selectedMonth,
  setSelectedMonth,
  selectedMonthEntries,
  openFinancialEntry,
  RecentOperationRow,
  fontBaseStyle,
  fontDisplayHeroStyle,
  fontDisplayTitleStyle,
  fontDisplayMediumStyle,
  fontBodyMediumStyle,
  fontLabelStyle,
  fontCapsStyle,
}: OperationsSectionProps) {
  return (
    <>
      <SectionTitle
        title="Финансы"
        subtitle="Лента операций в банковом стиле: чисто, плотно и без лишнего шума."
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

      <div className="space-y-3">
        {selectedMonthEntries.length > 0 ? (
          selectedMonthEntries.map((entry) => (
            <RecentOperationRow
              key={`${entry.source}-${String(entry.id)}`}
              entry={entry}
              onOpen={openFinancialEntry}
            />
          ))
        ) : (
          <GlassCard className="p-6" fontBaseStyle={fontBaseStyle}>
            <p className="text-[18px] text-white" style={fontDisplayMediumStyle}>
              Пока пусто
            </p>
            <p className="mt-2 text-sm text-[#8b97b5]" style={fontBodyMediumStyle}>
              За этот месяц данных пока нет.
            </p>
          </GlassCard>
        )}
      </div>
    </>
  )
}