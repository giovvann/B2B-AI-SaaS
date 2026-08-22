import Link from 'next/link'
import { ArrowLeft, PackageX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-espresso-50 dark:bg-[#0d0b09] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
          <PackageX className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-black text-espresso-900 dark:text-white mb-3">
          Producto no encontrado
        </h1>
        <p className="text-lg text-espresso-600 dark:text-espresso-400 mb-8">
          El producto que buscas no existe o no pertenece a tu boutique.
        </p>
        <Link
          href="/ingresos"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-gold-400/30 transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inventario
        </Link>
      </div>
    </div>
  )
}