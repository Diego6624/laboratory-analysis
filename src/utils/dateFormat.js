export function formatPeruDate(date) {
  if (!date) return 'Sin fecha'

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(date))
}

export function formatPeruDateTime(date) {
  if (!date) return 'Sin fecha de emision'

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Lima',
  }).format(new Date(date))
}
