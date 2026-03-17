import React from "react"

export function useAppointmentForm() {
  // =========================
  // STATE
  // =========================

  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const [client, setClient] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [date, setDate] = React.useState("")
  const [startTime, setStartTime] = React.useState("14:00")
  const [endTime, setEndTime] = React.useState("15:00")
  const [owner, setOwner] = React.useState<"Азат" | "Марс">("Азат")
  const [status, setStatus] = React.useState("Ожидание")
  const [note, setNote] = React.useState("")

  const [services, setServices] = React.useState<any[]>([])
  const [payments, setPayments] = React.useState<any[]>([])

  // =========================
  // HELPERS
  // =========================

  const makeId = () => Date.now() + Math.random()

  const makeService = () => ({
    id: makeId(),
    amount: 0,
  })

  const makePayment = (type = "Нал") => ({
    id: makeId(),
    type,
    amount: 0,
  })

  // =========================
  // RESET
  // =========================

  function reset() {
    setClient("")
    setPhone("")
    setDate("")
    setStartTime("14:00")
    setEndTime("15:00")
    setOwner("Азат")
    setStatus("Ожидание")
    setNote("")
    setServices([makeService()])
    setPayments([makePayment()])
    setEditingId(null)
  }

  // =========================
  // OPEN / CLOSE
  // =========================

  function openCreate() {
    reset()
    setOpen(true)
  }

  function openEdit(appointment: any) {
    setEditingId(appointment.id)
    setClient(appointment.client)
    setPhone(appointment.phone)
    setDate(appointment.date)
    setStartTime(appointment.startTime)
    setEndTime(appointment.endTime)
    setOwner(appointment.owner)
    setStatus(appointment.status)
    setNote(appointment.note)
    setServices(appointment.services || [])
    setPayments(appointment.payments || [])
    setOpen(true)
  }

  function close() {
    setOpen(false)
    reset()
  }

  // =========================
  // SERVICES
  // =========================

  function addService() {
    setServices((prev) => [...prev, makeService()])
  }

  function updateService(id: number, patch: any) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    )
  }

  function removeService(id: number) {
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  // =========================
  // PAYMENTS
  // =========================

  function addPayment(type: "Нал" | "Карта") {
    setPayments((prev) => [...prev, makePayment(type)])
  }

  function updatePayment(id: number, patch: any) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    )
  }

  function removePayment(id: number) {
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }

  // =========================
  // SAVE (ты потом подставишь supabase)
  // =========================

  function save() {
    console.log("SAVE", {
      client,
      phone,
      date,
      startTime,
      endTime,
      owner,
      status,
      note,
      services,
      payments,
    })
  }

  return {
    // state
    open,
    editingId,

    client,
    phone,
    date,
    startTime,
    endTime,
    owner,
    status,
    note,
    services,
    payments,

    // setters
    setClient,
    setPhone,
    setDate,
    setStartTime,
    setEndTime,
    setOwner,
    setStatus,
    setNote,

    // actions
    openCreate,
    openEdit,
    close,
    save,

    addService,
    updateService,
    removeService,

    addPayment,
    updatePayment,
    removePayment,
  }
}