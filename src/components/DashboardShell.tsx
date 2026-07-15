'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getDeviceId, getDeviceName } from '@/lib/device'
import { HomePageContent } from '@/app/dashboard/HomePageContent'
import { Crown, User, Loader2, ShieldAlert, Smartphone, Lock } from 'lucide-react'

type View = 'loading' | 'choice' | 'pin' | 'pending' | 'owner' | 'employee' | 'revoked' | 'error'

interface DashboardShellProps {
  userName: string
  boutiqueName: string
  boutiqueId: string
}

export function DashboardShell({ userName, boutiqueName, boutiqueId }: DashboardShellProps) {
  const [view, setView] = useState<View>('loading')
  const [message, setMessage] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const supabase = createClient()

  // Al montar, verificar el estado de este dispositivo
  useEffect(() => {
    checkDevice()
  }, [])

  const checkDevice = async () => {
    const deviceId = getDeviceId()
    if (!deviceId) {
      setView('error')
      setMessage('Error al identificar el dispositivo')
      return
    }

    try {
      // Verificar si este dispositivo ya está registrado
      const { data: dispositivos, error } = await supabase
        .from('dispositivos')
        .select('*')
        .eq('device_id', deviceId)
        .eq('boutique_id', boutiqueId)
        .limit(1)

      if (error) throw error

      const dispositivo = dispositivos?.[0]

      if (!dispositivo) {
        // Nuevo dispositivo: mostrar elección de rol
        setView('choice')
      } else if (dispositivo.status === 'approved') {
        // PIN ya verificado en esta sesión?
        const pinVerified = sessionStorage.getItem('veliora_pin_verified')
        if (dispositivo.role === 'owner' && !pinVerified) {
          // Dueño pero PIN no verificado esta sesión → pedir PIN
          setView('pin')
        } else {
          setView(dispositivo.role as View)
        }
      } else if (dispositivo.status === 'pending') {
        setView('pending')
      } else if (dispositivo.status === 'revoked') {
        setView('revoked')
      }
    } catch (err: any) {
      setView('error')
      setMessage(err.message)
    }
  }

  const handleChooseOwner = () => {
    setView('pin')
    setPin('')
    setPinError('')
  }

  const handleChooseEmployee = async () => {
    const deviceId = getDeviceId()
    if (!deviceId) return
    try {
      setView('loading')
      setMessage('Registrando dispositivo...')
      const res = await fetch('/api/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          device_name: getDeviceName(),
          role: 'employee',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setView('pending')
    } catch (err: any) {
      setView('error')
      setMessage(err.message)
    }
  }

  const handleVerifyPin = async () => {
    setPinError('')
    if (pin.length < 4) {
      setPinError('El PIN debe tener al menos 4 dígitos')
      return
    }
    setPinLoading(true)
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // PIN correcto: registrar/actualizar dispositivo como dueño
      const deviceId = getDeviceId()
      await fetch('/api/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          device_name: getDeviceName(),
          role: 'owner',
        }),
      })

      // Guardar verificación en sessionStorage (dura solo esta sesión del navegador)
      sessionStorage.setItem('veliora_pin_verified', 'true')
      setView('owner')
    } catch (err: any) {
      setPinError(err.message || 'PIN incorrecto')
    } finally {
      setPinLoading(false)
    }
  }

  // --- RENDER ---

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">{message || 'Cargando...'}</p>
        </div>
      </div>
    )
  }

  // Error
  if (view === 'error') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Error</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{message}</p>
          <button
            onClick={checkDevice}
            className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Elección de rol (nuevo dispositivo)
  if (view === 'choice') {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              {boutiqueName}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Hola, <span className="font-bold">{userName}</span> — ¿qué rol tienes?
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleChooseOwner}
              className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                <Crown className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">SOY DUEÑO</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Ingresa tu PIN para acceder a métricas y configuración.</p>
            </button>
            <button
              onClick={handleChooseEmployee}
              className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 border-2 border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all text-left"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                <User className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">SOY EMPLEADO</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Solicita acceso al dueño para registrar ventas.</p>
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Pantalla de PIN
  if (view === 'pin') {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-3">
            PIN DEL DUEÑO
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
            Ingresa tu PIN para acceder al panel de administración. 
            Solo se pedirá una vez por sesión.
          </p>
          <div className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Ingresa tu PIN"
              className="w-full text-center text-2xl tracking-[0.5em] bg-white dark:bg-[#1a1a1a] border border-zinc-300 dark:border-zinc-700 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
              disabled={pinLoading}
            />
            {pinError && (
              <p className="text-red-500 text-sm">{pinError}</p>
            )}
            <button
              onClick={handleVerifyPin}
              disabled={pinLoading || pin.length < 4}
              className="w-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pinLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </span>
              ) : (
                'VERIFICAR PIN'
              )}
            </button>
            <button
              onClick={() => { setView('choice'); setPin(''); setPinError('') }}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              ← Elegir otro rol
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Pendiente de aprobación
  if (view === 'pending') {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
            <Smartphone className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-3">
            ESPERANDO APROBACIÓN
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
            Tu dispositivo está registrado pero pendiente de aprobación del dueño.
            Pídele que revise su panel de <strong>Gestionar empleados</strong> para darte acceso.
          </p>
          <button
            onClick={checkDevice}
            className="mt-8 px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Verificar estado
          </button>
        </div>
      </main>
    )
  }

  // Acceso revocado
  if (view === 'revoked') {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
            <ShieldAlert className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-3">
            ACCESO REVOCADO
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            El dueño ha revocado el acceso a este dispositivo. Contacta al dueño para más información.
          </p>
        </div>
      </main>
    )
  }

  // Dueño o empleado aprobado → HomePageContent
  return (
    <HomePageContent
      role={view as 'owner' | 'employee'}
      userName={userName}
      boutiqueName={boutiqueName}
      showAdmin={true}
    />
  )
}
