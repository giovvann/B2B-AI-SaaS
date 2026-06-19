import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export type ExportFormat = 'csv' | 'xlsx'

// Convertir datos a CSV
export function toCSV(data: Record<string, any>[]): string {
  return Papa.unparse(data)
}

// Convertir datos a Excel (buffer)
export function toExcel(data: Record<string, any>[], sheetName: string = 'Datos'): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

// Descargar archivo en el navegador
export function downloadFile(
  content: string | ArrayBuffer,
  filename: string,
  mimeType: string
) {
  const blob = content instanceof ArrayBuffer
    ? new Blob([content], { type: mimeType })
    : new Blob([content], { type: mimeType })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Descargar CSV
export function downloadCSV(data: Record<string, any>[], filename: string) {
  const csv = toCSV(data)
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

// Descargar Excel
export function downloadExcel(data: Record<string, any>[], filename: string, sheetName: string = 'Datos') {
  const buffer = toExcel(data, sheetName)
  downloadFile(buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}