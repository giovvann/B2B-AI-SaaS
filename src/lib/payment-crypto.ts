import crypto from 'crypto'

/**
 * Cifrado de códigos de tarjetas (riel oxxo_giftcard).
 * El código en claro NUNCA se guarda en la DB: solo AES-256-GCM.
 * Solo service_role lo descifra (cola superadmin). Requiere:
 *   PAY_CODE_KEY = 64 hex chars (generar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
 */

function getKey(): Buffer {
  const hex = process.env.PAY_CODE_KEY || ''
  if (!isCodeKeyReady()) {
    throw new Error('PAY_CODE_KEY ausente o inválida (se requieren 64 hex chars)')
  }
  return Buffer.from(hex, 'hex')
}

export function isCodeKeyReady(): boolean {
  return /^[0-9a-fA-F]{64}$/.test(process.env.PAY_CODE_KEY || '')
}

export function isVisionReady(): boolean {
  return !!(process.env.NVIDIA_NIM_API_KEY || process.env.GOOGLE_GEMINI_API_KEY)
}

export function encryptCode(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decryptCode(payload: string): string {
  const [ivH, tagH, encH] = payload.split(':')
  if (!ivH || !tagH || !encH) throw new Error('code_enc corrupto')
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivH, 'hex'))
  decipher.setAuthTag(Buffer.from(tagH, 'hex'))
  return decipher.update(Buffer.from(encH, 'hex'), undefined, 'utf8') + decipher.final('utf8')
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update('VELIORA-OXXO|' + code.trim().toUpperCase()).digest('hex')
}
