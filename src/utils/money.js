// Misma moneda que el panel web (bolivianos).
const formatter = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export const money = (value) => `Bs ${formatter.format(Number(value || 0))}`

export const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Efectivo' },
  { value: 'Transfer', label: 'Transferencia' },
  { value: 'Card', label: 'Tarjeta' },
  { value: 'Other', label: 'Otro' }
]

// Horario del evento para el aviso de consumos: "sáb 3/10 18:00 – dom 4/10 02:00"
export const eventWindowLabel = ({ startsAt, endsAt }) => {
  if (!startsAt) return ''
  const day = (d) => d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'numeric' })
  const hour = (d) => d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const start = new Date(startsAt)
  if (!endsAt) return `${day(start)} desde las ${hour(start)}`
  const end = new Date(endsAt)
  // Si termina otro día (pasada la medianoche) se aclara la fecha de fin.
  const endText = end.toDateString() === start.toDateString() ? hour(end) : `${day(end)} ${hour(end)}`
  return `${day(start)} ${hour(start)} – ${endText}`
}

export const paymentLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || value || '-'
