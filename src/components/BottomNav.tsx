type Tab = "dashboard" | "schedule" | "operations" | "analytics" | "settings"

export default function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: Tab
  onChange: (tab: Tab) => void
}) {
  const item = (tab: Tab, label: string) => (
    <button
      onClick={() => onChange(tab)}
      className={`flex-1 py-2 text-xs ${
        activeTab === tab ? "text-white" : "text-white/40"
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0b0f17] border-t border-white/10 flex">
      {item("dashboard", "Главная")}
      {item("schedule", "График")}
      {item("operations", "Финансы")}
      {item("analytics", "Аналитика")}
      {item("settings", "Ещё")}
    </div>
  )
}