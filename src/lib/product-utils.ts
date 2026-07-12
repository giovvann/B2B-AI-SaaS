// Utilidades compartidas para mostrar atributos de producto de forma legible.

// Mapa de tallas cortas -> texto completo (MX)
const SIZE_MAP: Record<string, string> = {
  ch: 'Chica',
  chica: 'Chica',
  'ch ': 'Chica',
  m: 'Mediano',
  md: 'Mediano',
  mediano: 'Mediano',
  g: 'Grande',
  gd: 'Grande',
  grande: 'Grande',
  xl: 'Extra Grande',
  'x-large': 'Extra Grande',
  xxl: 'Doble Extra Grande',
  '2xl': 'Doble Extra Grande',
  s: 'Pequeña',
  sm: 'Pequeña',
  pequena: 'Pequeña',
  pequeña: 'Pequeña',
  u: 'Única',
  unica: 'Única',
  unitalla: 'Única',
}

export function formatSize(size: string | null | undefined): string {
  if (!size) return ''
  const key = size.trim().toLowerCase()
  return SIZE_MAP[key] ?? size.trim()
}

export function formatColor(color: string | null | undefined): string {
  return color?.trim() ? color.trim() : ''
}

// Lo que antes era "Único"/"Unitalla" placeholder ahora se muestra vacío o discreto.
export function displaySize(size: string | null | undefined): string {
  const f = formatSize(size)
  return f && f.toLowerCase() !== 'única' ? f : ''
}

export function displayColor(color: string | null | undefined): string {
  return formatColor(color) ? formatColor(color) : ''
}
