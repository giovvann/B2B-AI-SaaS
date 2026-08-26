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

/**
 * Huella del navegador (anti-abuso del trial).
 * Combina UA, pantalla, zona horaria, canvas y WebGL en un SHA-256.
 * A diferencia de device_id (localStorage), sobrevive al borrado de
 * datos del navegador: es la segunda señal de claim_trial().
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return ''
  try {
    const parts: string[] = [
      navigator.userAgent || '',
      navigator.language || '',
      (navigator as unknown as { platform?: string }).platform || '',
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    ]
    // Canvas: el renderizado de texto+formas varía por GPU/driver/fuente
    try {
      const c = document.createElement('canvas')
      c.width = 220
      c.height = 30
      const ctx = c.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillStyle = '#f60'
        ctx.fillRect(0, 0, 220, 30)
        ctx.fillStyle = '#069'
        ctx.fillText('Veliora-fp', 2, 2)
        parts.push(c.toDataURL())
      }
    } catch {}
    // WebGL: vendor/renderer real de la GPU
    try {
      const c = document.createElement('canvas')
      const gl = (c.getContext('webgl') || c.getContext('experimental-webgl')) as WebGLRenderingContext | null
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info')
        if (dbg) {
          parts.push(String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) ?? ''))
          parts.push(String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? ''))
        }
      }
    } catch {}
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('|')))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return ''
  }
}
