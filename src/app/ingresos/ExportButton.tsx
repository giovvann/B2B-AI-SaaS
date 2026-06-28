'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { exportInventory, exportSales } from '@/app/exportar/actions'
import { downloadCSV, downloadExcel } from '@/lib/import-export/generators'

export function ExportButton({ type }: { type: 'inventory' | 'sales' }) {
  const [loading, setLoading] = useState(false)
  
  const handleExport = async (format: 'csv' | 'xlsx') => {
    setLoading(true)
    try {
      const result = type === 'inventory' 
        ? await exportInventory() 
        : await exportSales()
      
      const timestamp = new Date().toISOString().split('T')[0]
      const boutiqueSlug = result.boutiqueName.toLowerCase().replace(/\s+/g, '_')
      const filename = `${type === 'inventory' ? 'inventario' : 'ventas'}_${boutiqueSlug}_${timestamp}`
      
      if (format === 'csv') {
        downloadCSV(result.data, `${filename}.csv`)
      } else {
        downloadExcel(result.data, `${filename}.xlsx`, type === 'inventory' ? 'Inventario' : 'Ventas')
      }
    } catch (err) {
      alert('Error al exportar: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }
  
  const label = type === 'inventory' ? 'EXPORTAR INV' : 'EXPORTAR VENTAS'
  const shortLabel = type === 'inventory' ? 'Exportar' : 'Ventas'
  
  return (
    <div className="relative group">
      <button
        disabled={loading}
        className="w-full min-h-[70px] md:min-h-[90px] bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 text-white font-bold md:font-black text-sm md:text-lg tracking-wider rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border border-white/20 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin" />
        ) : (
          <Download className="w-4 h-4 md:w-6 md:h-6" strokeWidth={2.5} />
        )}
        <span className="hidden md:inline">{label}</span>
        <span className="md:hidden">{shortLabel}</span>
      </button>
      
      {/* Dropdown para elegir formato */}
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
        <button
          onClick={() => handleExport('xlsx')}
          disabled={loading}
          className="w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-500" />
          Descargar como Excel (.xlsx)
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={loading}
          className="w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-colors flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-500" />
          Descargar como CSV
        </button>
      </div>
    </div>
  )
}