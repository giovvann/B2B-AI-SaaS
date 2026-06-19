'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import Link from 'next/link'
import { exportInventory, exportSales } from '@/app/exportar/actions'
import { downloadCSV, downloadExcel } from '@/lib/import-export/generators'

export function ImportExportButtons() {
  const [loading, setLoading] = useState<'inventory' | 'sales' | null>(null)
  
  const handleExport = async (type: 'inventory' | 'sales', format: 'csv' | 'xlsx') => {
    setLoading(type)
    try {
      const result = type === 'inventory' 
        ? await exportInventory() 
        : await exportSales()
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${type === 'inventory' ? 'inventario' : 'ventas'}_${result.boutiqueName.replace(/\s+/g, '_')}_${timestamp}.${format}`
      
      if (format === 'csv') {
        downloadCSV(result.data, filename)
      } else {
        downloadExcel(result.data, filename, type === 'inventory' ? 'Inventario' : 'Ventas')
      }
    } catch (err) {
      alert('Error al exportar: ' + (err as Error).message)
    } finally {
      setLoading(null)
    }
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
      <Link href="/importar" className="group block">
        <div className="min-h-[90px] bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base md:text-lg tracking-wider rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] border-2 border-white/20">
          <Upload className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
          <span>IMPORTAR</span>
        </div>
      </Link>
      
      <div className="relative group">
        <button
          disabled={loading === 'inventory'}
          className="w-full min-h-[90px] bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-zinc-300 disabled:to-zinc-400 text-white font-black text-base md:text-lg tracking-wider rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] border-2 border-white/20"
        >
          {loading === 'inventory' ? (
            <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
          ) : (
            <Download className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          )}
          <span>EXPORTAR INVENTARIO</span>
        </button>
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
          <button
            onClick={() => handleExport('inventory', 'xlsx')}
            disabled={loading === 'inventory'}
            className="w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-500" />
            Descargar como Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport('inventory', 'csv')}
            disabled={loading === 'inventory'}
            className="w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-colors flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            Descargar como CSV
          </button>
        </div>
      </div>
      
      <div className="relative group">
        <button
          disabled={loading === 'sales'}
          className="w-full min-h-[90px] bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:from-zinc-300 disabled:to-zinc-400 text-white font-black text-base md:text-lg tracking-wider rounded-2xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] border-2 border-white/20"
        >
          {loading === 'sales' ? (
            <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
          ) : (
            <Download className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          )}
          <span>EXPORTAR VENTAS</span>
        </button>
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
          <button
            onClick={() => handleExport('sales', 'xlsx')}
            disabled={loading === 'sales'}
            className="w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-500" />
            Descargar como Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport('sales', 'csv')}
            disabled={loading === 'sales'}
            className="w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-colors flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            Descargar como CSV
          </button>
        </div>
      </div>
    </div>
  )
}