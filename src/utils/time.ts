import { pad2 } from "./date"

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeTimeValue(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return { hour: 14, minute: 0 }
  }

  const [rawHour, rawMinute] = value.split(":").map(Number)

  return {
    hour: clamp(Number.isFinite(rawHour) ? rawHour : 14, 0, 23),
    minute: clamp(Number.isFinite(rawMinute) ? rawMinute : 0, 0, 59),
  }
}

export function toTimeString(hour: number, minute: number) {
  return `${pad2(hour)}:${pad2(minute)}`
}

export function addMinutesToTime(time: string, delta: number) {
  const normalized = normalizeTimeValue(time)
  const total = normalized.hour * 60 + normalized.minute + delta
  const wrapped = ((total % 1440) + 1440) % 1440
  const hour = Math.floor(wrapped / 60)
  const minute = wrapped % 60
  return toTimeString(hour, minute)
}

export function setTimeHour(time: string, hour: number) {
  const normalized = normalizeTimeValue(time)
  return toTimeString(clamp(hour, 0, 23), normalized.minute)
}

export function setTimeMinute(time: string, minute: number) {
  const normalized = normalizeTimeValue(time)
  return toTimeString(normalized.hour, clamp(minute, 0, 59))
}

export function roundMinuteToClosestPreset(minute: number) {
  const presets = [0, 15, 30, 45]
  let best = presets[0]
  let bestDiff = Math.abs(minute - presets[0])

  presets.forEach((preset) => {
    const diff = Math.abs(minute - preset)
    if (diff < bestDiff) {
      best = preset
      bestDiff = diff
    }
  })

  return best
}

export function applyTimePreset(
  key: "morning" | "day" | "evening" | "late",
  baseTime: string
) {
  if (key === "morning") return "10:00"
  if (key === "day") return "14:00"
  if (key === "evening") return "18:00"
  if (key === "late") return setTimeMinute(baseTime, roundMinuteToClosestPreset(30))
  return baseTime
}

export function formatTimeRange(startTime?: string, endTime?: string) {
  if (!startTime && !endTime) return ""
  if (startTime && endTime) return `${startTime} — ${endTime}`
  return startTime || endTime || ""
}