export function formatMoney(value: number) {
  if (Number.isInteger(value)) return `${value} ₽`
  return `${value.toFixed(1)} ₽`
}