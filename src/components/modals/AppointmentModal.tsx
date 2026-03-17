export function AppointmentModal(props: any) {
  if (!props.open) return null

  return (
    <div className="fixed inset-0">
      <div className="modal">

        <AppointmentHeader
          editing={props.editing}
          onClose={props.onClose}
          onDelete={props.onDelete}
        />

        <AppointmentClientFields
          client={props.client}
          phone={props.phone}
          onClientChange={props.setClient}
          onPhoneChange={props.setPhone}
        />

        <AppointmentDateTimeFields
          date={props.date}
          startTime={props.startTime}
          endTime={props.endTime}
          owner={props.owner}
          onDateChange={props.setDate}
          onStartTimeChange={props.setStartTime}
          onEndTimeChange={props.setEndTime}
          onOwnerClick={props.openOwnerPicker}
        />

        <AppointmentServicesBlock {...props} />
        <AppointmentPaymentsBlock {...props} />
        <AppointmentStatusField {...props} />

        <button onClick={props.onSave}>Сохранить</button>
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
      <button onClick={onClose}>✕</button>

      <h2 className="text-white font-semibold">
        {editing ? "Редактировать запись" : "Новая запись"}
      </h2>

      {editing ? (
        <button onClick={onDelete} className="text-red-400">
          Удалить
        </button>
      ) : (
        <div className="w-[40px]" />
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
    <div>
      <p className="text-xs text-white/40 mb-1">Клиент</p>

      <div className="grid grid-cols-2 gap-2">
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Имя"
          className="bg-white/5 rounded p-2 text-white"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон"
          className="bg-white/5 rounded p-2 text-white"
        />
      </div>
    </div>
  )
}

function AppointmentDateTimeFields({
  date,
  startTime,
  endTime,
  owner,
  setDate,
  setStartTime,
  setEndTime,
  onOwnerClick,
}: any) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">Дата и время</p>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-white/5 rounded p-2 text-white"
        />

        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="bg-white/5 rounded p-2 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="bg-white/5 rounded p-2 text-white"
        />

        <button
          onClick={onOwnerClick}
          className="bg-white/5 rounded p-2 text-white"
        >
          {owner}
        </button>
      </div>
    </div>
  )
}

function AppointmentServicesBlock({
  services,
  onAdd,
  onUpdate,
  onRemove,
}: any) {
  return (
    <div className="mt-3">
      <div className="flex justify-between mb-2">
        <p>Услуги</p>
        <button onClick={onAdd}>+ Услуга</button>
      </div>

      {services.map((s: any) => (
        <div key={s.id} className="flex gap-2 mb-2">
          <input
            type="number"
            value={s.amount}
            onChange={(e) =>
              onUpdate(s.id, { amount: Number(e.target.value) })
            }
            className="flex-1 bg-white/5 rounded p-2 text-white"
          />

          <button onClick={() => onRemove(s.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

function AppointmentPaymentsBlock({
  payments,
  onAddCash,
  onAddCard,
  onUpdate,
  onRemove,
}: any) {
  return (
    <div className="mt-3">
      <p className="mb-2">Оплаты</p>

      {payments.map((p: any) => (
        <div key={p.id} className="flex gap-2 mb-2">
          <input
            type="number"
            value={p.amount}
            onChange={(e) =>
              onUpdate(p.id, { amount: Number(e.target.value) })
            }
            className="flex-1 bg-white/5 rounded p-2 text-white"
          />

          <button onClick={() => onRemove(p.id)}>✕</button>
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <button onClick={onAddCash}>+ Нал</button>
        <button onClick={onAddCard}>+ Карта</button>
      </div>
    </div>
  )
}

function AppointmentStatusField({
  status,
  onClick,
}: any) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-3 bg-white/5 rounded p-2 text-white"
    >
      {status}
    </button>
  )
}