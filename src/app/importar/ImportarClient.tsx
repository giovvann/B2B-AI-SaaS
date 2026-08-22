'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sun, Moon, X, Upload, FileSpreadsheet, Package,
  Loader2, Check, AlertCircle, ArrowRight, Sparkles
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { parseFile, autoMapColumns, ParsedData } from '@/lib/import-export/parsers'
import { importProducts } from './actions'

type ImportType = 'products' | 'sales'
type ImportStep = 'select' | 'preview' | 'mapping' | 'importing' | 'success'

const PRODUCT_FIELDS = [
  { key: 'name', label: 'Nombre del producto', required: true },
  { key: 'brand', label: 'Marca', required: false },
  { key: 'season', label: 'Temporada', required: false },
  { key: 'size', label: 'Talla', required: false },
  { key: 'color', label: 'Color', required: false },
  { key: 'sku', label: 'SKU', required: false },
  { key: 'purchase_price', label: 'Precio de compra', required: true },
  { key: 'sale_price', label: 'Precio de venta', required: true },
  { key: 'stock', label: 'Stock', required: true },
]

export function ImportarClient({ boutiqueName }: { boutiqueName: string }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<ImportStep>('select')
  const [importType, setImportType] = useState<ImportType>('products')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importedCount, setImportedCount] = useState(0)
  
  const handleFileSelect = async (file: File) => {
    try {
      const maxSize = 20 * 1024 * 1024 // 20MB
      if (file.size > maxSize) {
        toast.error('El archivo es demasiado grande (máximo 20MB)')
        return
      }
      
      const data = await parseFile(file)
      
      if (data.totalRows === 0) {
        toast.error('El archivo está vacío')
        return
      }
      
      setParsedData(data)
      setFileName(file.name)
      
      // Auto-mapear columnas
      const autoMapping = autoMapColumns(data.headers, importType)
      setMapping(autoMapping)
      
      toast.success(`${data.totalRows} filas detectadas`)
      setStep('mapping')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }
  
  const handleImport = () => {
    if (!parsedData) return
    
    // Validar que los campos requeridos estén mapeados
    const requiredFields = PRODUCT_FIELDS.filter(f => f.required)
    const missingFields = requiredFields.filter(f => !mapping[f.key])
    
    if (missingFields.length > 0) {
      toast.error(`Faltan campos requeridos: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }
    
    setStep('importing')
    
    startTransition(async () => {
      try {
        // Transformar filas usando el mapeo
        const products = parsedData.rows.map(row => ({
          name: String(row[mapping.name] || '').trim(),
          brand: mapping.brand ? String(row[mapping.brand] || '') : undefined,
          season: mapping.season ? String(row[mapping.season] || '') : undefined,
          size: mapping.size ? String(row[mapping.size] || '') : undefined,
          color: mapping.color ? String(row[mapping.color] || '') : undefined,
          sku: mapping.sku ? String(row[mapping.sku] || '') : undefined,
          purchase_price: Number(row[mapping.purchase_price]) || 0,
          sale_price: Number(row[mapping.sale_price]) || 0,
          stock: Number(row[mapping.stock]) || 0,
        }))
        
        const result = await importProducts(products)
        setImportedCount(result.count)
        setStep('success')
        toast.success(`${result.count} productos importados a ${result.boutiqueName}`)
      } catch (err) {
        toast.error((err as Error).message)
        setStep('mapping')
      }
    })
  }
  
  const resetAll = () => {
    setStep('select')
    setParsedData(null)
    setFileName('')
    setMapping({})
    setImportedCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  
  return (
    <div className="min-h-screen bg-espresso-50 dark:bg-espresso-900 p-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto pb-8">
        <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-4 bg-white dark:bg-[#16130f] rounded-2xl hover:bg-espresso-100 dark:hover:bg-espresso-800 transition-colors border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-espresso-800 dark:text-espresso-200" />
            ) : (
              <Moon className="w-5 h-5 text-espresso-800 dark:text-espresso-200" />
            )}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-5 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-colors border border-red-200 dark:border-red-900/50 shadow-sm"
          >
            <X className="w-4 h-4" strokeWidth={3} />
            <span className="text-sm md:text-base">CERRAR</span>
          </button>
        </div>
        
        <div className="mb-8 pr-32">
          <div className="text-xs font-bold text-espresso-400 uppercase tracking-[0.2em] mb-2">
            {boutiqueName}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-espresso-900 dark:text-white mb-2">
            IMPORTAR DATOS
          </h1>
          <p className="text-base text-espresso-600 dark:text-espresso-400">
            Migra tu inventario desde Excel, CSV o JSON en segundos
          </p>
        </div>
        
        {/* Paso 1: Seleccionar tipo y subir archivo */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#16130f] rounded-3xl p-6 md:p-8 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-xl">
              <h2 className="text-xl md:text-2xl font-black text-espresso-900 dark:text-white mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6" />
                ¿Qué quieres importar?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setImportType('products')}
                  className={`p-5 rounded-2xl border-2 transition-all text-left ${
                    importType === 'products'
                      ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                      : 'border-espresso-200 dark:border-[rgba(200,164,118,0.16)] hover:border-espresso-300'
                  }`}
                >
                  <Package className={`w-8 h-8 mb-2 ${importType === 'products' ? 'text-gold-500' : 'text-espresso-400'}`} />
                  <div className="font-black text-espresso-900 dark:text-white">INVENTARIO</div>
                  <div className="text-sm text-espresso-600 dark:text-espresso-400 mt-1">
                    Productos con precios y stock
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setImportType('sales')
                    toast('Importación de ventas próximamente', {
                      description: 'Por ahora solo puedes importar inventario. Las ventas estarán disponibles pronto.',
                    })
                  }}
                  disabled
                  className="p-5 rounded-2xl border-2 border-espresso-200 dark:border-[rgba(200,164,118,0.16)] opacity-50 cursor-not-allowed text-left"
                >
                  <FileSpreadsheet className="w-8 h-8 text-espresso-400 mb-2" />
                  <div className="font-black text-espresso-500 dark:text-espresso-500">VENTAS</div>
                  <div className="text-sm text-espresso-400 mt-1">Próximamente</div>
                </button>
              </div>
              
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-espresso-300 dark:border-espresso-700 rounded-2xl p-12 text-center cursor-pointer hover:border-gold-400 dark:hover:border-gold-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.txt"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <Upload className="w-16 h-16 text-espresso-400 mx-auto mb-4" />
                <p className="text-xl font-bold text-espresso-700 dark:text-espresso-300 mb-2">
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-espresso-600 dark:text-espresso-400">
                  Formatos: CSV, Excel (.xlsx), JSON, TXT · Máximo 20MB
                </p>
              </div>
            </div>
            
            <div className="bg-gold-50 dark:bg-gold-900/15 rounded-3xl p-6 border border-gold-200 dark:border-gold-800/50">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-gold-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-black text-espresso-700 dark:text-gold-300 mb-2">
                    Estructura recomendada del archivo
                  </h3>
                  <p className="text-sm text-gold-800 dark:text-gold-400 mb-3">
                    Tu archivo debe tener columnas como:
                  </p>
                  <div className="bg-white dark:bg-[#16130f] rounded-xl p-3 font-mono text-xs text-espresso-700 dark:text-espresso-300 overflow-x-auto">
                    Nombre, Marca, Temporada, Talla, Color, Precio_Compra, Precio_Venta, Stock<br />
                    Playera Básica, Nike, Verano, M, Blanco, 150, 299, 10<br />
                    Playera Básica, Nike, Verano, L, Blanco, 150, 299, 15<br />
                    Jeans Slim, Levis, Invierno, 30, Azul, 300, 599, 20
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Paso 2: Mapeo de columnas */}
        {step === 'mapping' && parsedData && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#16130f] rounded-3xl p-6 md:p-8 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-xl">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-espresso-900 dark:text-white mb-1">
                    Mapeo de columnas
                  </h2>
                  <p className="text-sm text-espresso-600 dark:text-espresso-400">
                    {fileName} · {parsedData.totalRows} filas detectadas
                  </p>
                </div>
                <button
                  onClick={resetAll}
                  className="px-4 py-2 text-sm font-bold text-espresso-600 dark:text-espresso-400 hover:text-espresso-900 dark:hover:text-white transition-colors"
                >
                  Cambiar archivo
                </button>
              </div>
              
              <div className="space-y-3 mb-6">
                {PRODUCT_FIELDS.map(field => (
                  <div
                    key={field.key}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center p-4 bg-espresso-50 dark:bg-espresso-900 rounded-2xl border border-espresso-200 dark:border-[rgba(200,164,118,0.16)]"
                  >
                    <div>
                      <div className="font-bold text-espresso-900 dark:text-white flex items-center gap-2">
                        {field.label}
                        {field.required && (
                          <span className="text-xs text-red-500 font-black">*OBLIGATORIO</span>
                        )}
                      </div>
                      <div className="text-xs text-espresso-600 dark:text-espresso-400 mt-1">
                        Campo interno: {field.key}
                      </div>
                    </div>
                    <select
                      value={mapping[field.key] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                      className="w-full bg-white dark:bg-[#16130f] border-2 border-espresso-200 dark:border-[rgba(200,164,118,0.16)] rounded-xl px-4 py-3 font-semibold text-espresso-900 dark:text-white focus:border-gold-400 focus:outline-none"
                    >
                      <option value="">-- No mapear --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleImport}
                disabled={isPending}
                className="w-full min-h-[70px] bg-gradient-to-br from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 disabled:from-espresso-300 disabled:to-espresso-400 text-white font-black text-lg tracking-wider rounded-2xl shadow-xl shadow-gold-400/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                <ArrowRight className="w-6 h-6" strokeWidth={3} />
                <span>IMPORTAR {parsedData.totalRows} PRODUCTOS</span>
              </button>
            </div>
            
            {/* Vista previa */}
            <div className="bg-white dark:bg-[#16130f] rounded-3xl p-6 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-xl overflow-hidden">
              <h3 className="font-black text-espresso-900 dark:text-white mb-4">
                Vista previa (primeras 5 filas)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-espresso-200 dark:border-[rgba(200,164,118,0.16)]">
                      {parsedData.headers.map(h => (
                        <th key={h} className="px-3 py-2 text-left font-black text-espresso-500 uppercase text-xs">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-espresso-100 dark:border-[rgba(200,164,118,0.16)]">
                        {parsedData.headers.map(h => (
                          <td key={h} className="px-3 py-2 text-espresso-700 dark:text-espresso-300">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Paso 3: Importando */}
        {step === 'importing' && (
          <div className="bg-white dark:bg-[#16130f] rounded-3xl p-12 border border-espresso-200 dark:border-[rgba(200,164,118,0.16)] shadow-xl text-center">
            <Loader2 className="w-20 h-20 text-gold-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-black text-espresso-900 dark:text-white mb-2">
              Importando productos...
            </h2>
            <p className="text-espresso-600 dark:text-espresso-400">
              Esto puede tomar unos segundos dependiendo del tamaño del archivo
            </p>
          </div>
        )}
        
        {/* Paso 4: Éxito */}
        {step === 'success' && (
          <div className="bg-gradient-to-br from-gold-50 to-gold-50 dark:from-gold-900/30 dark:to-gold-900/30 rounded-3xl p-8 md:p-12 border border-gold-200 dark:border-gold-900/50 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gold-500 rounded-full mb-6 shadow-xl shadow-gold-500/30">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-espresso-900 dark:text-white mb-3">
              ¡IMPORTACIÓN EXITOSA!
            </h2>
            <p className="text-lg text-espresso-600 dark:text-espresso-300 mb-8">
              Se importaron <span className="font-black text-gold-600 dark:text-gold-400">{importedCount}</span> productos a tu inventario
            </p>
            <div className="flex flex-col md:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/ingresos')}
                className="px-8 py-4 bg-gradient-to-br from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white font-black tracking-wider rounded-2xl shadow-lg shadow-gold-400/30 transition-all active:scale-[0.98]"
              >
                VER MI INVENTARIO
              </button>
              <button
                onClick={resetAll}
                className="px-8 py-4 bg-white dark:bg-[#16130f] hover:bg-espresso-50 dark:hover:bg-espresso-800 text-espresso-700 dark:text-espresso-300 font-black tracking-wider rounded-2xl border-2 border-espresso-200 dark:border-[rgba(200,164,118,0.16)] transition-all"
              >
                IMPORTAR OTRO ARCHIVO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}