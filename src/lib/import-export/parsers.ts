import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export interface ParsedData {
  headers: string[]
  rows: Record<string, any>[]
  totalRows: number
}

// Parsear CSV
export function parseCSV(content: string): ParsedData {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })
  
  const headers = result.meta.fields || []
  const rows = result.data as Record<string, any>[]
  
  return {
    headers,
    rows,
    totalRows: rows.length,
  }
}

// Parsear Excel
export function parseExcel(buffer: ArrayBuffer): ParsedData {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as Record<string, any>[]
  
  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
  
  return {
    headers,
    rows: jsonData,
    totalRows: jsonData.length,
  }
}

// Parsear JSON
export function parseJSON(content: string): ParsedData {
  let data: any
  try {
    data = JSON.parse(content)
  } catch {
    throw new Error('El archivo JSON no tiene un formato válido')
  }
  const rows = Array.isArray(data) ? data : [data]
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []

  return {
    headers,
    rows,
    totalRows: rows.length,
  }
}

// Parsear archivo según su extensión
export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  if (extension === 'csv' || extension === 'txt') {
    const text = await file.text()
    return parseCSV(text)
  }
  
  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer()
    return parseExcel(buffer)
  }
  
  if (extension === 'json') {
    const text = await file.text()
    return parseJSON(text)
  }
  
  throw new Error(`Formato no soportado: .${extension}`)
}

// Detectar automáticamente el mapeo de columnas
export function autoMapColumns(
  fileHeaders: string[],
  type: 'products' | 'sales'
): Record<string, string> {
  const mapping: Record<string, string> = {}
  
  const productPatterns: Record<string, string[]> = {
    name: ['nombre', 'name', 'producto', 'product', 'descripcion', 'description', 'articulo'],
    brand: ['marca', 'brand'],
    season: ['temporada', 'season'],
    size: ['talla', 'size', 'medida'],
    color: ['color', 'colour'],
    sku: ['sku', 'codigo', 'codigo_producto', 'cod'],
    purchase_price: ['precio_compra', 'purchase_price', 'costo', 'cost', 'precio_costo'],
    sale_price: ['precio_venta', 'sale_price', 'precio', 'price', 'precio_publico'],
    stock: ['stock', 'cantidad', 'quantity', 'existencias', 'inventario'],
  }
  
  const salesPatterns: Record<string, string[]> = {
    product_name: ['producto', 'product', 'nombre_producto', 'articulo'],
    quantity: ['cantidad', 'quantity', 'unidades'],
    price: ['precio', 'price', 'precio_venta', 'total_unitario'],
    date: ['fecha', 'date', 'fecha_venta'],
    payment_method: ['pago', 'payment', 'metodo_pago', 'metodo'],
  }
  
  const patterns = type === 'products' ? productPatterns : salesPatterns
  
  for (const [field, keywords] of Object.entries(patterns)) {
    const normalizedFileHeaders = fileHeaders.map(h => h.toLowerCase().trim())
    
    for (let i = 0; i < fileHeaders.length; i++) {
      const header = normalizedFileHeaders[i]
      if (keywords.some(k => header.includes(k))) {
        mapping[field] = fileHeaders[i]
        break
      }
    }
  }
  
  return mapping
}