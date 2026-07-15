/**
 * Identificación del dispositivo (navegador).
 * Cada navegador/celular tiene un device_id único guardado en localStorage.
 */

let cachedId: string | null = null

export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  if (cachedId) return cachedId
  const key = 'veliora_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  cachedId = id
  return id
}

export function getDeviceName(): string {
  if (typeof window === 'undefined') return ''
  const ua = navigator.userAgent
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  return navigator.platform || 'Desconocido'
}

export function clearDeviceId() {
  cachedId = null
  localStorage.removeItem('veliora_device_id')
}
