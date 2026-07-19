import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Sin conexión</h1>
        <p className="text-gray-400 leading-relaxed mb-6">
          No tienes internet en este momento. No te preocupes — las operaciones que realices se guardarán localmente y se sincronizarán automáticamente cuando recuperes la señal.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Reconectando automáticamente...
        </div>
        <div className="mt-8 text-xs text-gray-600">
          Veliora funciona sin conexión gracias a sincronización local.
        </div>
      </div>
    </div>
  );
}
