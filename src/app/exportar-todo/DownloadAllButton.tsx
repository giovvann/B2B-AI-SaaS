'use client'

import { useState } from 'react'
import { Download, Loader2, CheckCircle, FileDown } from 'lucide-react'

interface Props {
  boutiqueName: string
}

export function DownloadAllButton({ boutiqueName }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [done, setDone] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/export-all')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al exportar')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = boutiqueName.replace(/[^a-zA-Z0-9]/g, '_')
      a.download = `${safeName}_Veliora_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setDone(true)
      setTimeout(() => setDone(false), 5000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDownloading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-3 px-8 py-5 bg-green-500/10 border border-green-500/30 text-green-400 font-bold rounded-2xl w-full">
        <CheckCircle className="w-6 h-6" />
        <span>DESCARGADO EXITOSAMENTE</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="w-full min-h-[64px] bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg tracking-wide rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {downloading ? (
        <>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>GENERANDO EXPORTACIÓN...</span>
        </>
      ) : (
        <>
          <FileDown className="w-6 h-6" strokeWidth={2.5} />
          <span>DESCARGAR TODO (ZIP)</span>
        </>
      )}
    </button>
  )
}
