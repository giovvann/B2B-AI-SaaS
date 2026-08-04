/**
 * Utilidades de formato para Veliora.
 * Moneda MXN, fechas relativas en español, fechas cortas.
 */

export function formatMoney(n: number | string | null | undefined): string {
  const num = Number(n || 0)
  if (isNaN(num)) return '$0'
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatMoneyCents(n: number | string | null | undefined): string {
  const num = Number(n || 0)
  if (isNaN(num)) return '$0.00'
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** "hace 5 min", "hace 3 días", "ayer", "hoy" */
export function formatRelativeTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'ahora mismo'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHr < 24) {
    if (diffHr === 1) return 'hace 1 hora'
    return `hace ${diffHr} horas`
  }
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay} días`

  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

/** Fecha corta: "12 ago 2026" */
export function formatDateShort(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Fecha + hora: "12 ago, 3:45 PM" */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) +
    ', ' + date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
}

/** Iniciales para avatar: "Juan Pérez" -> "JP" */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('')
}
