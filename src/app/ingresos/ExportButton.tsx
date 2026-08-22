'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { exportInventory, exportSales } from '@/app/exportar/actions'
import { downloadCSV, downloadExcel } from '@/lib/import-export/generators'
import { useToast } from '@/components/toast'

export function ExportButton({ type }: { type: 'inventory' | 'sales' }) {
  const [loading, setLoading] = useState(false)
  const { error, success } = useToast()
  
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
      success(type === 'inventory' ? 'Inventario exportado' : 'Ventas exportadas', 'Archivo descargado correctamente')
    } catch (err) {
      error('Error al exportar', (err as Error).message)
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
        className="w-full min-h-[70px] md:min-h-[90px] bg-gradient-to-br from-espresso-500 to-espresso-700 hover:from-espresso-600 hover:to-espresso-700 disabled:from-espresso-300 disabled:to-espresso-400 dark:disabled:from-espresso-700 dark:disabled:to-espresso-800 text-white font-bold md:font-black text-sm md:text-lg tracking-wider rounded-2xl shadow-lg shadow-gold-400/30 hover:shadow-gold-400/50 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border border-white/20 disabled:cursor-not-allowed"
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
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#16130f] rounded-2xl shadow-2xl border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
        <button
          onClick={() => handleExport('xlsx')}
          disabled={loading}
          className="w-full px-4 py-3 text-left hover:bg-espresso-100 dark:hover:bg-espresso-800 text-espresso-700 dark:text-espresso-300 font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-gold-500" />
          Descargar como Excel (.xlsx)
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={loading}
          className="w-full px-4 py-3 text-left hover:bg-espresso-100 dark:hover:bg-espresso-800 text-espresso-700 dark:text-espresso-300 font-bold text-sm transition-colors flex items-center gap-2 border-t border-espresso-100 dark:border-[rgba(200,164,118,0.16)] disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-gold-500" />
          Descargar como CSV
        </button>
      </div>
    </div>
  )
}