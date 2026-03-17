import React from "react"

const OWNER_OPTIONS = ["Азат", "Марс"] as const
const STATUS_OPTIONS = [
  "Ожидание",
  "Подтвердил",
  "Пришел",
  "Не пришел",
] as const

export function AppointmentModal(props: any) {
  if (!props.open) return null

  const servicesTotal = (props.services || []).reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0),
    0
  )

  const paymentsTotal = (props.payments || []).reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0),
    0
  )

  const remaining = Math.max(servicesTotal - paymentsTotal, 0)

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md">
      <div
        className="absolute inset-0"
        onClick={props.onClose}
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[560px] rounded-t-[32px] border border-white/10 bg-[linear-gradient(180deg,#08101d_0%,#050912_100%)] shadow-[0_-30px_80px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="max-h-[88vh] overflow-y-auto px-4 pb-[118px] pt-3 sm:px-5">
          <AppointmentHeader
            editing={props.editing}
            onClose={props.onClose}
            onDelete={props.onDelete}
          />

          <div className="space-y-4">
            <AppointmentClientFields
              client={props.client}
              phone={props.phone}
              setClient={props.setClient}
              setPhone={props.setPhone}
            />

            <AppointmentDateTimeFields
              date={props.date}
              startTime={props.startTime}
              endTime={props.endTime}
              setDate={props.setDate}
              setStartTime={props.setStartTime}
              setEndTime={props.setEndTime}
            />

            <AppointmentOwnerField
              owner={props.owner}
              setOwner={props.setOwner}
            />

            <AppointmentCommentField
              note={props.note}
              setNote={props.setNote}
            />

            <AppointmentServicesBlock
              services={props.services}
              onAdd={props.onAddService}
              onUpdate={props.onUpdateService}
              onRemove={props.onRemoveService}
            />

            <AppointmentPaymentsBlock
              payments={props.payments}
              servicesTotal={servicesTotal}
              paymentsTotal={paymentsTotal}
              remaining={remaining}
              onAddCash={props.onAddCash}
              onAddCard={props.onAddCard}
              onUpdate={props.onUpdatePayment}
              onRemove={props.onRemovePayment}
            />

            <AppointmentStatusField
              status={props.status}
              setStatus={props.setStatus}
            />
          </div>
        </div>

        <AppointmentBottomBar
          servicesTotal={servicesTotal}
          paymentsTotal={paymentsTotal}
          remaining={remaining}
          onSave={props.onSave}
        />
      </div>
    </div>
  )
}

function AppointmentHeader({
  editing,
  onClose,
  onDelete,
}: {
  editing: boolean
  onClose: () => void
  onDelete?: () => void
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={onClose}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.055] text-xl text-white/90 ring-1 ring-white/10 transition hover:bg-white/[0.08]"
      >
        ✕
      </button>

      <div className="text-center">
        <h2 className="text-[20px] font-semibold text-white">
          {editing ? "Редактировать запись" : "Новая запись"}
        </h2>
        <p className="mt-0.5 text-[12px] text-white/40">
          Быстрое оформление клиента, услуги и оплаты
        </p>
      </div>

      {editing ? (
        <button
          onClick={onDelete}
          className="flex h-11 min-w-[44px] items-center justify-center rounded-full bg-red-500/12 px-3 text-sm font-medium text-red-300 ring-1 ring-red-400/20 transition hover:bg-red-500/18"
        >
          Удалить
        </button>
      ) : (
        <div className="w-[44px]" />
      )}
    </div>
  )
}

function AppointmentClientFields({
  client,
  phone,
  setClient,
  setPhone,
}: any) {
  return (
    <SectionCard>
      <SectionTop
        title="Клиент"
        subtitle="Кто записан и как с ним связаться"
      />

      <div className="grid grid-cols-2 gap-3">
        <FieldInput
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Имя клиента"
        />

        <FieldInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон"
          inputMode="tel"
        />
      </div>
    </SectionCard>
  )
}

function AppointmentDateTimeFields({
  date,
  startTime,
  endTime,
  setDate,
  setStartTime,
  setEndTime,
}: any) {
  return (
    <SectionCard>
      <SectionTop
        title="Дата и время"
        subtitle="Когда начнется и закончится сессия"
      />

      <div className="grid grid-cols-2 gap-3">
        <FieldInput
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <FieldInput
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <FieldInput
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
    </SectionCard>
  )
}

function AppointmentOwnerField({
  owner,
  setOwner,
}: {
  owner: string
  setOwner?: (value: string) => void
}) {
  return (
    <SectionCard>
      <SectionTop
        title="Ответственный"
        subtitle="Кто ведет клиента"
      />

      <SegmentedTabs
        options={OWNER_OPTIONS}
        value={owner}
        onChange={setOwner}
      />
    </SectionCard>
  )
}

function AppointmentCommentField({
  note,
  setNote,
}: {
  note: string
  setNote?: (value: string) => void
}) {
  return (
    <SectionCard>
      <SectionTop
        title="Комментарий"
        subtitle="Любые детали по записи"
      />

      <textarea
        value={note}
        onChange={(e) => setNote?.(e.target.value)}
        placeholder="Например: нужен черновой вокал, клиент опоздает на 10 минут..."
        className="min-h-[96px] w-full resize-none rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/28 focus:border-blue-400/35"
      />
    </SectionCard>
  )
}

function AppointmentServicesBlock({
  services,
  onAdd,
  onUpdate,
  onRemove,
}: any) {
  const rows = services || []

  return (
    <SectionCard>
      <div className="mb-3 flex items-start justify-between gap-3">
        <SectionTop
          title="Услуги"
          subtitle="Что делаем и сколько это стоит"
          className="mb-0"
        />

        <button
          onClick={onAdd}
          className="shrink-0 rounded-[16px] bg-blue-500/12 px-3 py-2 text-sm font-medium text-blue-200 ring-1 ring-blue-400/20 transition hover:bg-blue-500/18"
        >
          + Услуга
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((service: any, index: number) => {
          const isRecording = service.type === "Запись"

          return (
            <div
              key={service.id}
              className="rounded-[22px] border border-blue-400/20 bg-[linear-gradient(180deg,rgba(8,21,42,0.95),rgba(7,14,28,0.95))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-white">
                  Услуга {index + 1}
                </p>

                <button
                  onClick={() => onRemove(service.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-red-500/12 text-[18px] text-red-300 ring-1 ring-red-400/18 transition hover:bg-red-500/18"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
                <select
                  value={service.type || "Запись"}
                  onChange={(e) =>
                    onUpdate(service.id, {
                      type: e.target.value,
                      ...(e.target.value === "Запись"
                        ? {
                            hours:
                              service.hours === "" || service.hours == null
                                ? 1
                                : service.hours,
                          }
                        : {}),
                    })
                  }
                  className="h-[52px] rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 text-[15px] text-white outline-none focus:border-blue-400/35"
                >
                  <option value="Запись" className="bg-[#0b1220]">
                    Запись
                  </option>
                  <option value="Сведение" className="bg-[#0b1220]">
                    Сведение
                  </option>
                  <option value="Дистрибуция" className="bg-[#0b1220]">
                    Дистрибуция
                  </option>
                  <option value="Мастеринг" className="bg-[#0b1220]">
                    Мастеринг
                  </option>
                  <option value="Другое" className="bg-[#0b1220]">
                    Другое
                  </option>
                </select>

                {isRecording ? (
                  <FieldInput
                    type="number"
                    min="1"
                    value={service.hours ?? ""}
                    onChange={(e) =>
                      onUpdate(service.id, {
                        hours:
                          e.target.value === "" ? "" : Number(e.target.value),
                        amount:
                          e.target.value === ""
                            ? 0
                            : Number(e.target.value) * 1000,
                      })
                    }
                    placeholder="Часы"
                  />
                ) : (
                  <FieldInput
                    type="number"
                    min="0"
                    value={service.amount ?? 0}
                    onChange={(e) =>
                      onUpdate(service.id, {
                        amount: Number(e.target.value),
                      })
                    }
                    placeholder="Сумма"
                  />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-[18px] bg-white/[0.03] px-4 py-3 ring-1 ring-white/6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/30">
                    Итого по услуге
                  </p>
                  <p className="mt-1 text-[17px] font-semibold text-white">
                    {formatMoney(Number(service.amount || 0))}
                  </p>
                </div>

                {isRecording ? (
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-white/30">
                      Часы
                    </p>
                    <p className="mt-1 text-sm text-white/85">
                      {service.hours || 0} ч
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

function AppointmentPaymentsBlock({
  payments,
  servicesTotal,
  paymentsTotal,
  remaining,
  onAddCash,
  onAddCard,
  onUpdate,
  onRemove,
}: any) {
  const rows = payments || []

  return (
    <SectionCard>
      <div className="mb-3 flex items-start justify-between gap-3">
        <SectionTop
          title="Оплаты"
          subtitle="Разбей оплату по способам, если нужно"
          className="mb-0"
        />

        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/28">
            Осталось
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatMoney(remaining)}
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <MiniStat
          label="Услуги"
          value={formatMoney(servicesTotal)}
        />
        <MiniStat
          label="Оплачено"
          value={formatMoney(paymentsTotal)}
        />
        <MiniStat
          label="Остаток"
          value={formatMoney(remaining)}
        />
      </div>

      <div className="space-y-3">
        {rows.map((payment: any) => (
          <div
            key={payment.id}
            className="grid grid-cols-[1fr_0.9fr_44px] gap-3 rounded-[20px] border border-blue-400/15 bg-[linear-gradient(180deg,rgba(8,21,42,0.88),rgba(7,14,28,0.92))] p-3"
          >
            <button
              onClick={() =>
                onUpdate(payment.id, {
                  type: payment.type === "Нал" ? "Карта" : "Нал",
                })
              }
              className="h-[52px] rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 text-left text-[15px] text-white transition hover:border-blue-400/25"
            >
              {payment.type || "Нал"}
            </button>

            <FieldInput
              type="number"
              min="0"
              value={payment.amount ?? 0}
              onChange={(e) =>
                onUpdate(payment.id, {
                  amount: Number(e.target.value),
                })
              }
              placeholder="0"
            />

            <button
              onClick={() => onRemove(payment.id)}
              className="flex h-[52px] items-center justify-center rounded-[18px] bg-red-500/12 text-[18px] text-red-300 ring-1 ring-red-400/18 transition hover:bg-red-500/18"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          onClick={onAddCash}
          className="h-[50px] rounded-[18px] bg-[linear-gradient(180deg,#6f88ff,#4e66ee)] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(82,102,255,0.35)] transition hover:scale-[0.99]"
        >
          + Нал
        </button>

        <button
          onClick={onAddCard}
          className="h-[50px] rounded-[18px] bg-[linear-gradient(180deg,#6f88ff,#4e66ee)] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(82,102,255,0.35)] transition hover:scale-[0.99]"
        >
          + Карта
        </button>
      </div>
    </SectionCard>
  )
}

function AppointmentStatusField({
  status,
  setStatus,
}: {
  status: string
  setStatus?: (value: string) => void
}) {
  return (
    <SectionCard>
      <SectionTop
        title="Статус"
        subtitle="Можно поменять в один тап"
      />

      <div className="grid grid-cols-2 gap-2">
        {STATUS_OPTIONS.map((option) => {
          const active = status === option

          return (
            <button
              key={option}
              onClick={() => setStatus?.(option)}
              className={`h-[48px] rounded-[18px] px-4 text-sm font-medium transition ${
                active
                  ? "bg-[linear-gradient(180deg,#6f88ff,#4e66ee)] text-white shadow-[0_10px_30px_rgba(82,102,255,0.28)]"
                  : "bg-white/[0.04] text-white/72 ring-1 ring-white/8 hover:bg-white/[0.06]"
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}

function AppointmentBottomBar({
  servicesTotal,
  paymentsTotal,
  remaining,
  onSave,
}: {
  servicesTotal: number
  paymentsTotal: number
  remaining: number
  onSave: () => void
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 border-t border-white/8 bg-[linear-gradient(180deg,rgba(8,12,20,0.8),rgba(7,11,18,0.98))] px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/30">
            Итого / оплачено
          </p>
          <p className="mt-1 truncate text-sm text-white/80">
            {formatMoney(servicesTotal)} / {formatMoney(paymentsTotal)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/30">
            Остаток
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {formatMoney(remaining)}
          </p>
        </div>
      </div>

      <button
        onClick={onSave}
        className="h-[54px] w-full rounded-[20px] bg-[linear-gradient(180deg,#7890ff,#6077f3)] text-[16px] font-semibold text-white shadow-[0_18px_40px_rgba(87,108,255,0.34)] transition hover:translate-y-[1px]"
      >
        Сохранить
      </button>
    </div>
  )
}

function SectionCard({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      {children}
    </div>
  )
}

function SectionTop({
  title,
  subtitle,
  className = "",
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={`mb-3 ${className}`}>
      <p className="text-[17px] font-semibold text-white">{title}</p>
      {subtitle ? (
        <p className="mt-1 text-sm text-white/42">{subtitle}</p>
      ) : null}
    </div>
  )
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-[52px] w-full rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 text-[15px] text-white outline-none placeholder:text-white/28 focus:border-blue-400/35 ${props.className || ""}`}
    />
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[18px] bg-white/[0.03] px-3 py-3 ring-1 ring-white/6">
      <p className="text-[11px] uppercase tracking-[0.12em] text-white/28">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  )
}

function SegmentedTabs({
  options,
  value,
  onChange,
}: {
  options: readonly string[]
  value: string
  onChange?: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const active = value === option

        return (
          <button
            key={option}
            onClick={() => onChange?.(option)}
            className={`h-[48px] rounded-[18px] px-4 text-sm font-medium transition ${
              active
                ? "bg-[linear-gradient(180deg,#6f88ff,#4e66ee)] text-white shadow-[0_10px_30px_rgba(82,102,255,0.28)]"
                : "bg-white/[0.04] text-white/72 ring-1 ring-white/8 hover:bg-white/[0.06]"
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function formatMoney(value: number) {
  return `${Number(value || 0)} ₽`
}