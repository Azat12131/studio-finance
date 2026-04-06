export function pad2(value: number | string) {
  return String(value).padStart(2, "0")
}

export function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseInputDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDisplayDate(dateString: string) {
  if (!dateString) return ""
  const date = parseInputDate(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("ru-RU")
}

export function formatCompactDate(dateString: string) {
  if (!dateString) return "Выбрать дату"
  const date = parseInputDate(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatHumanDate(dateString: string) {
  if (!dateString) return "Выбрать дату"
  const date = parseInputDate(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  })
}

export function getInitialMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function toMonthKey(dateString: string) {
  if (!dateString) return getInitialMonthKey()
  const date = parseInputDate(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  })
}

export function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(year, month, 0).getDate()
}