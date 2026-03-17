import React from "react"
import logoWhite from "./assets/logo-white.png"

import { useAppointmentForm } from "./features/appointments/useAppointmentForm"
import { AppointmentModal } from "./components/modals/AppointmentModal"
import BottomNav from "./components/BottomNav"

// секции
import Dashboard from "./sections/Dashboard"
import Schedule from "./sections/Schedule"
import Operations from "./sections/Operations"
import Analytics from "./sections/Analytics"
import Settings from "./sections/Settings"

// =========================
// TYPES
// =========================

type Tab =
  | "dashboard"
  | "schedule"
  | "operations"
  | "analytics"
  | "settings"

// =========================
// APP
// =========================

export default function App() {
  // =========================
  // NAVIGATION
  // =========================

  const [activeTab, setActiveTab] = useTabNavigation()

  // =========================
  // FORM (вынесено)
  // =========================

  const form = useAppointmentForm()

  // =========================
  // RENDER
  // =========================

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="mx-auto w-full max-w-[900px] px-4 pb-24 pt-4">

        <AppHeader onCreate={form.openCreate} />

        <MainContent
          activeTab={activeTab}
          onCreate={form.openCreate}
        />

      </div>

      <AppointmentModal {...mapFormToModalProps(form)} />

      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
      />
    </div>
  )
}

//
// =========================
// UI БЛОКИ
// =========================
//

function AppHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <img src={logoWhite} className="w-[80px]" />

      <button
        onClick={onCreate}
        className="rounded-xl bg-blue-600 px-4 py-2"
      >
        + Запись
      </button>
    </div>
  )
}

function MainContent({
  activeTab,
  onCreate,
}: {
  activeTab: Tab
  onCreate: () => void
}) {
  if (activeTab === "dashboard") return <Dashboard />
  if (activeTab === "schedule") return <Schedule onCreate={onCreate} />
  if (activeTab === "operations") return <Operations />
  if (activeTab === "analytics") return <Analytics />
  if (activeTab === "settings") return <Settings />

  return null
}

//
// =========================
// HOOKS
// =========================
//

function useTabNavigation() {
  const [activeTab, setActiveTab] = React.useState<Tab>("dashboard")

  return [activeTab, setActiveTab] as const
}

//
// =========================
// МАППИНГ FORM → MODAL
// =========================
//

function mapFormToModalProps(form: ReturnType<typeof useAppointmentForm>) {
  return {
    open: form.open,
    editing: !!form.editingId,

    client: form.client,
    phone: form.phone,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    owner: form.owner,
    status: form.status,
    note: form.note,

    services: form.services,
    payments: form.payments,

    setClient: form.setClient,
    setPhone: form.setPhone,
    setDate: form.setDate,
    setStartTime: form.setStartTime,
    setEndTime: form.setEndTime,
    setOwner: form.setOwner,
    setStatus: form.setStatus,
    setNote: form.setNote,

    onAddService: form.addService,
    onUpdateService: form.updateService,
    onRemoveService: form.removeService,

    onAddCash: () => form.addPayment("Нал"),
    onAddCard: () => form.addPayment("Карта"),
    onUpdatePayment: form.updatePayment,
    onRemovePayment: form.removePayment,

    onClose: form.close,
    onSave: form.save,
  }
}