import React from "react"
import { cn } from "../utils/cn"
import { formatMonthLabel } from "../utils/date"
import { getProgressWidth } from "../utils/finance"
import { SparkIcon } from "./icons"

type FontSet = {
  fontBaseStyle: React.CSSProperties
  fontDisplayHeroStyle: React.CSSProperties
  fontDisplayTitleStyle: React.CSSProperties
  fontDisplayMediumStyle: React.CSSProperties
  fontBodyMediumStyle: React.CSSProperties
  fontLabelStyle: React.CSSProperties
  fontCapsStyle: React.CSSProperties
}

export function GlassCard({
  children,
  className = "",
  glow = false,
  fontBaseStyle,
}: {
  children: React.ReactNode
  className?: string
  glow?: boolean
  fontBaseStyle: React.CSSProperties
}) {
  return (
    <div
      className={cn("neo-card animate-fade-up", glow && "neo-card-glow", className)}
      style={fontBaseStyle}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
  fonts,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  fonts: FontSet
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div
          className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase text-[#98a8d4] backdrop-blur-xl"
          style={fonts.fontCapsStyle}
        >
          <SparkIcon />
          Studio control
        </div>
        <h1
          className="mt-4 truncate text-[34px] text-white sm:text-[42px]"
          style={fonts.fontDisplayTitleStyle}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className="mt-2 max-w-[720px] text-[14px] text-[#8f98b3] sm:text-[15px]"
            style={fonts.fontBodyMediumStyle}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function PrimaryButton({
  children,
  className = "",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("btn-primary", className)} style={style}>
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className = "",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("btn-ghost", className)} style={style}>
      {children}
    </button>
  )
}

export function IconButton({
  children,
  className = "",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("icon-button", className)} style={style}>
      {children}
    </button>
  )
}

export function TextInput({
  className = "",
  placeholder,
  onFocus,
  onBlur,
  style,
  fontBaseStyle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  fontBaseStyle: React.CSSProperties
}) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <input
      {...props}
      placeholder={isFocused ? "" : placeholder}
      onFocus={(e) => {
        setIsFocused(true)
        if (props.type === "number") {
          requestAnimationFrame(() => e.currentTarget.select())
        }
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsFocused(false)
        onBlur?.(e)
      }}
      style={{ ...fontBaseStyle, ...style }}
      className={cn("field-input", className)}
    />
  )
}

export function TextArea({
  className = "",
  placeholder,
  onFocus,
  onBlur,
  style,
  fontBaseStyle,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fontBaseStyle: React.CSSProperties
}) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <textarea
      {...props}
      placeholder={isFocused ? "" : placeholder}
      onFocus={(e) => {
        setIsFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsFocused(false)
        onBlur?.(e)
      }}
      style={{ ...fontBaseStyle, ...style }}
      className={cn("field-textarea", className)}
    />
  )
}

export function InputWithIcon({
  icon,
  className = "",
  fontBaseStyle,
  fontBodyMediumStyle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode
  fontBaseStyle: React.CSSProperties
  fontBodyMediumStyle: React.CSSProperties
}) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <div className={cn("field-input flex items-center gap-3 px-4", className)} style={fontBaseStyle}>
      <div className="shrink-0 text-[#7280a5]">{icon}</div>
      <input
        {...props}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        placeholder={isFocused ? "" : props.placeholder}
        style={fontBodyMediumStyle}
        className="h-full w-full min-w-0 border-0 bg-transparent p-0 text-[15px] text-white outline-none placeholder:text-[rgba(214,223,247,0.48)]"
      />
    </div>
  )
}

export function ProgressLine({
  value,
  total,
  colorClassName,
  heightClassName = "h-[12px]",
}: {
  value: number
  total: number
  colorClassName: string
  heightClassName?: string
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        heightClassName
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out shadow-[0_0_30px_rgba(111,147,255,0.25)]",
          colorClassName
        )}
        style={{ width: `${getProgressWidth(value, total)}%` }}
      />
    </div>
  )
}

export function MonthTabs({
  months,
  selectedMonth,
  onChange,
  fontDisplayMediumStyle,
}: {
  months: string[]
  selectedMonth: string
  onChange: (month: string) => void
  fontDisplayMediumStyle: React.CSSProperties
}) {
  return (
    <div className="mb-6">
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2.5">
          {months.map((monthKey) => {
            const active = monthKey === selectedMonth
            return (
              <button
                key={monthKey}
                onClick={() => onChange(monthKey)}
                style={fontDisplayMediumStyle}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm capitalize transition duration-200",
                  active
                    ? "month-tab-active"
                    : "border border-white/8 bg-white/[0.04] text-[#9aa5c3] hover:border-white/12 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {formatMonthLabel(monthKey)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function StatMini({
  label,
  value,
  sub,
  accent = "default",
  fontCapsStyle,
  fontDisplayTitleStyle,
  fontBodyMediumStyle,
  fontBaseStyle,
}: {
  label: string
  value: string
  sub?: string
  accent?: "default" | "good" | "danger"
  fontCapsStyle: React.CSSProperties
  fontDisplayTitleStyle: React.CSSProperties
  fontBodyMediumStyle: React.CSSProperties
  fontBaseStyle: React.CSSProperties
}) {
  return (
    <GlassCard className="p-5" fontBaseStyle={fontBaseStyle}>
      <p className="text-[12px] uppercase text-[#7d89ab]" style={fontCapsStyle}>
        {label}
      </p>
      <p
        style={fontDisplayTitleStyle}
        className={cn(
          "mt-4 text-[30px]",
          accent === "good" && "text-emerald-300",
          accent === "danger" && "text-rose-300",
          accent === "default" && "text-white"
        )}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-2 text-sm text-[#8f98b3]" style={fontBodyMediumStyle}>
          {sub}
        </p>
      ) : null}
    </GlassCard>
  )
}