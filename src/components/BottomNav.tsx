import { Home, Wallet, BarChart3, Settings } from "lucide-react"

export default function BottomNav() {
  return (
    <div className="bottom-nav">
      <button>
        <Home size={22} />
        <span>Главная</span>
      </button>

      <button>
        <Wallet size={22} />
        <span>Операции</span>
      </button>

      <button>
        <BarChart3 size={22} />
        <span>Статистика</span>
      </button>

      <button>
        <Settings size={22} />
        <span>Настройки</span>
      </button>
    </div>
  )
}