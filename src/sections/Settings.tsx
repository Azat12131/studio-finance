import React from "react"

import { PlusIcon } from "../components/icons"
import { GlassCard, GhostButton, SectionTitle, TextInput } from "../components/ui"
import { formatMonthLabel } from "../lib/dates"

type SettingsSectionProps = {
  monthGoal: number
  selectedMonth: string
  createNewMonth: () => void | Promise<void>
  deleteSelectedMonth: () => void | Promise<void>
  onMonthGoalChange: (value: number) => void | Promise<void>
  FormLabel: React.ComponentType<{ children: React.ReactNode }>
  fontBaseStyle: React.CSSProperties
  fontDisplayHeroStyle: React.CSSProperties
  fontDisplayTitleStyle: React.CSSProperties
  fontDisplayMediumStyle: React.CSSProperties
  fontBodyMediumStyle: React.CSSProperties
  fontLabelStyle: React.CSSProperties
  fontCapsStyle: React.CSSProperties
}

export default function SettingsSection({
  monthGoal,
  selectedMonth,
  createNewMonth,
  deleteSelectedMonth,
  onMonthGoalChange,
  FormLabel,
  fontBaseStyle,
  fontDisplayHeroStyle,
  fontDisplayTitleStyle,
  fontDisplayMediumStyle,
  fontBodyMediumStyle,
  fontLabelStyle,
  fontCapsStyle,
}: SettingsSectionProps) {
  return (
    <>
      <SectionTitle
        title="Настройки"
        subtitle="Управление целями, месяцами и системными действиями."
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

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <GlassCard className="p-5 sm:p-6" fontBaseStyle={fontBaseStyle}>
          <FormLabel>Цель месяца</FormLabel>

          <TextInput
            type="number"
            value={monthGoal}
            fontBaseStyle={fontBaseStyle}
            onChange={(e) => void onMonthGoalChange(Number(e.target.value))}
          />

          <p className="mt-3 text-sm text-[#8b97b5]" style={fontBodyMediumStyle}>
            Актуальная цель для {formatMonthLabel(selectedMonth)}.
          </p>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6" fontBaseStyle={fontBaseStyle}>
          <p className="text-[12px] uppercase text-[#7b88aa]" style={fontCapsStyle}>
            Месяцы
          </p>
          <p className="mt-2 text-[22px] text-white" style={fontDisplayMediumStyle}>
            Управление месяцами
          </p>
          <p className="mt-2 text-sm text-[#8b97b5]" style={fontBodyMediumStyle}>
            Создание нового месяца и удаление текущего выбранного месяца.
          </p>

          <div className="mt-5 grid gap-3">
            <GhostButton
              onClick={() => void createNewMonth()}
              className="h-[50px] w-full justify-center"
              style={fontDisplayMediumStyle}
            >
              <PlusIcon />
              Новый месяц
            </GhostButton>

            <button
              onClick={() => void deleteSelectedMonth()}
              className="danger-button"
              style={fontDisplayMediumStyle}
            >
              Удалить месяц
            </button>
          </div>
        </GlassCard>
      </div>
    </>
  )
}