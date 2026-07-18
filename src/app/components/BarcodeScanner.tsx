'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, X, Loader2, Barcode, ScanLine } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(true)
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    startScanner()
    return () => { void stopScanner() }
  }, [])

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      const html5QrCode = new Html5Qrcode('barcode-reader')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 4 / 3,
        },
        (decodedText) => {
          // Código detectado con éxito
          try { navigator.vibrate(100) } catch {}
          onScan(decodedText)
          stopScanner()
          onClose()
        },
        () => {
          // Callback de pérdida de cuadro (no hacer nada)
        }
      )

      setScanning(true)
      setError('')
    } catch (err) {
      console.error('Error iniciando escáner:', err)
      setError('No se pudo acceder a la cámara. Ingresa el código manualmente.')
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch {}
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold">Escáner de código de barras</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
              <p className="text-amber-400 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Camera / Scanner view */}
          <div
            ref={containerRef}
            className="relative rounded-2xl overflow-hidden bg-black mb-4 aspect-[4/3]"
          >
            <div id="barcode-reader" className="w-full h-full" />
            {scanning && (
              <>
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-4/5">
                    {/* Scanning line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full animate-pulse shadow-lg shadow-blue-500/50" />
                    {/* Corner brackets */}
                    <div className="absolute -top-8 -left-2 w-8 h-8 border-t-2 border-l-2 border-blue-400/60 rounded-tl" />
                    <div className="absolute -top-8 -right-2 w-8 h-8 border-t-2 border-r-2 border-blue-400/60 rounded-tr" />
                    <div className="absolute -bottom-8 -left-2 w-8 h-8 border-b-2 border-l-2 border-blue-400/60 rounded-bl" />
                    <div className="absolute -bottom-8 -right-2 w-8 h-8 border-b-2 border-r-2 border-blue-400/60 rounded-br" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 bg-blue-500/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <ScanLine className="w-3 h-3" />
                  ESCANEANDO...
                </div>
              </>
            )}
            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            )}
          </div>

          {/* Manual entry */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <p className="text-xs text-zinc-500 text-center">
              ¿No funciona la cámara? Ingresa el código manualmente:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                placeholder="Ej: 7501234567890"
                className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors text-center font-mono"
                autoFocus
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-6 py-3 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl transition-all disabled:opacity-40"
              >
                BUSCAR
              </button>
            </div>
          </form>

          <button
            onClick={startScanner}
            className="w-full mt-3 px-4 py-3 text-sm text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"
          >
            Reintentar cámara
          </button>
        </div>
      </div>
    </div>
  )
}
