'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { getDeviceId, getDeviceName } from '@/lib/device'
import { getPushPermission, isPushSupported, enablePushNotifications } from '@/lib/push-client'
import { HomePageContent } from '@/app/dashboard/HomePageContent'
import { Crown, User, Loader2, ShieldAlert, Smartphone, Lock, XCircle, ArrowLeft } from 'lucide-react'

type View = 'loading' | 'choice' | 'pin' | 'create_pin' | 'pending' | 'owner' | 'employee' | 'revoked' | 'error'

interface DashboardShellProps {
  userName: string
  boutiqueName: string
  boutiqueId: string
  children?: ReactNode
}

export function DashboardShell({ userName, boutiqueName, boutiqueId, children }: DashboardShellProps) {
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
          // Dueño pero PIN no verificado esta sesión -> pedir PIN
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

  const handleCancelar = async () => {
    const deviceId = getDeviceId()
    if (!deviceId) return
    try {
      // Eliminar el registro pendiente
      await supabase
        .from('dispositivos')
        .delete()
        .eq('device_id', deviceId)
        .eq('boutique_id', boutiqueId)
        .eq('status', 'pending')
      setView('choice')
    } catch {
      setView('choice')
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
      // Si el dueño tiene activada la auto-aprobación, el empleado entra directo
      setView(data.status === 'approved' ? 'employee' : 'pending')
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
      if (!res.ok) {
        if (data.noPin) {
          // Cuenta sin PIN (ej. creada con Google): crear uno nuevo
          setPin('')
          setPinError('')
          setView('create_pin')
          return
        }
        throw new Error(data.error)
      }

      // PIN correcto: registrar/actualizar dispositivo como dueño
      const deviceId = getDeviceId()
      await fetch('/api/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          device_name: getDeviceName(),
          role: 'owner',
          pin,
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

  const handleCreatePin = async () => {
    setPinError('')
    if (pin.length < 4 || pin.length > 6) {
      setPinError('El PIN debe tener entre 4 y 6 dígitos')
      return
    }
    setPinLoading(true)
    try {
      const res = await fetch('/api/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const deviceId = getDeviceId()
      const devRes = await fetch('/api/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          device_name: getDeviceName(),
          role: 'owner',
          pin,
        }),
      })
      const devData = await devRes.json()
      if (!devRes.ok) throw new Error(devData.error)

      sessionStorage.setItem('veliora_pin_verified', 'true')
      setView('owner')
    } catch (err: any) {
      setPinError(err.message || 'Error al guardar el PIN')
    } finally {
      setPinLoading(false)
    }
  }

  // --- RENDER ---

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#c8a476] mx-auto mb-4" />
          <p className="text-[rgba(42,36,32,0.62)] dark:text-espresso-400">{message || 'Cargando...'}</p>
        </div>
      </div>
    )
  }

  // Error
  if (view === 'error') {
    return (
      <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#2a2420] dark:text-white mb-2">Error</h2>
          <p className="text-[rgba(42,36,32,0.62)] dark:text-espresso-400 text-sm">{message}</p>
          <button
            onClick={checkDevice}
            className="mt-6 px-6 py-3 bg-gradient-to-br from-[#c8a476] to-[#b8925e] text-white rounded-xl font-semibold hover:from-[#b8925e] hover:to-[#a8814d] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Elección de rol (nuevo dispositivo) — BOTONES MÁS GRANDES
  if (view === 'choice') {
    return (
      <main className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] p-4 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#2a2420] dark:text-white mb-3">
              {boutiqueName}
            </h1>
            <p className="text-[rgba(42,36,32,0.62)] dark:text-espresso-400 text-lg">
              Hola, <span className="font-bold">{userName}</span> — ¿qué rol tienes?
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleChooseOwner}
              className="bg-white dark:bg-[#16130f] rounded-[2rem] p-10 md:p-12 border-2 border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)] hover:border-[#c8a476] dark:hover:border-gold-400 transition-all text-left hover:shadow-xl hover:shadow-[rgba(200,164,118,0.1)] active:scale-[0.98]"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gold-400/30">
                <Crown className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#2a2420] dark:text-white mb-4 tracking-tight">SOY DUEÑO</h2>
              <p className="text-base md:text-lg text-[rgba(42,36,32,0.62)] dark:text-espresso-400 leading-relaxed">
                Ingresa tu PIN para acceder a métricas, inventario y configuración del negocio.
              </p>
              <div className="mt-6 pt-6 border-t border-[rgba(200,164,118,0.08)] dark:border-[rgba(200,164,118,0.16)]">
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs font-bold text-[rgba(42,36,32,0.5)] dark:text-espresso-500 uppercase tracking-wider bg-[rgba(200,164,118,0.06)] dark:bg-[#201b16] px-3 py-1.5 rounded-full">PIN requerido</span>
                  <span className="text-xs font-bold text-[rgba(42,36,32,0.5)] dark:text-espresso-500 uppercase tracking-wider bg-[rgba(200,164,118,0.06)] dark:bg-[#201b16] px-3 py-1.5 rounded-full">Acceso total</span>
                </div>
              </div>
            </button>
            <button
              onClick={handleChooseEmployee}
              className="bg-white dark:bg-[#16130f] rounded-[2rem] p-10 md:p-12 border-2 border-[rgba(200,164,118,0.12)] dark:border-[rgba(200,164,118,0.16)] hover:border-gold-400 dark:hover:border-gold-500 transition-all text-left hover:shadow-xl hover:shadow-[rgba(16,185,129,0.1)] active:scale-[0.98]"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gold-500/30">
                <User className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#2a2420] dark:text-white mb-4 tracking-tight">SOY EMPLEADO</h2>
              <p className="text-base md:text-lg text-[rgba(42,36,32,0.62)] dark:text-espresso-400 leading-relaxed">
                Solicita acceso al dueño. Podrás registrar ventas y agregar productos.
              </p>
              <div className="mt-6 pt-6 border-t border-[rgba(200,164,118,0.08)] dark:border-[rgba(200,164,118,0.16)]">
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs font-bold text-[rgba(42,36,32,0.5)] dark:text-espresso-500 uppercase tracking-wider bg-[rgba(200,164,118,0.06)] dark:bg-[#201b16] px-3 py-1.5 rounded-full">Requiere aprobación</span>
                  <span className="text-xs font-bold text-[rgba(42,36,32,0.5)] dark:text-espresso-500 uppercase tracking-wider bg-[rgba(200,164,118,0.06)] dark:bg-[#201b16] px-3 py-1.5 rounded-full">Solo ventas</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Pantalla de PIN
  if (view === 'pin') {
    return (
      <main className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] p-4 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold-400/30">
            <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#2a2420] dark:text-white mb-3">
            PIN DEL DUEÑO
          </h2>
          <p className="text-[rgba(42,36,32,0.62)] dark:text-espresso-400 text-sm mb-8">
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
              className="w-full text-center text-2xl tracking-[0.5em] bg-white dark:bg-[#16130f] border border-[rgba(200,164,118,0.12)] dark:border-espresso-700 rounded-2xl px-6 py-4 text-[#2a2420] dark:text-white placeholder-[rgba(42,36,32,0.5)] dark:placeholder-espresso-400 focus:outline-none focus:border-[#c8a476] dark:focus:border-gold-400 transition-colors"
              autoFocus
              disabled={pinLoading}
            />
            {pinError && (
              <p className="text-red-500 text-sm">{pinError}</p>
            )}
            <button
              onClick={handleVerifyPin}
              disabled={pinLoading || pin.length < 4}
              className="w-full bg-gradient-to-br from-[#c8a476] to-[#b8925e] hover:from-[#b8925e] hover:to-[#a8814d] text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[rgba(200,164,118,0.3)]"
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
              className="text-sm text-[rgba(42,36,32,0.55)] dark:text-espresso-400 hover:text-[#2a2420] dark:hover:text-espresso-300 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Elegir otro rol
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Crear PIN (cuentas sin PIN, ej. registro con Google)
  if (view === 'create_pin') {
    return (
      <main className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] p-4 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#c8a476] to-[#b8925e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[rgba(200,164,118,0.3)]">
            <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#2a2420] dark:text-white mb-3">
            CREA TU PIN
          </h2>
          <p className="text-[rgba(42,36,32,0.62)] dark:text-espresso-400 text-sm mb-8">
            Tu cuenta aún no tiene PIN. Crea uno de 4 a 6 dígitos para proteger
            métricas, gastos y configuración.
          </p>
          <div className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="4-6 dígitos"
              className="w-full text-center text-2xl tracking-[0.5em] bg-white dark:bg-[#16130f] border border-[rgba(200,164,118,0.12)] dark:border-espresso-700 rounded-2xl px-6 py-4 text-[#2a2420] dark:text-white placeholder-[rgba(42,36,32,0.5)] dark:placeholder-espresso-400 focus:outline-none focus:border-[#c8a476] transition-colors"
              autoFocus
              disabled={pinLoading}
            />
            {pinError && (
              <p className="text-red-500 text-sm">{pinError}</p>
            )}
            <button
              onClick={handleCreatePin}
              disabled={pinLoading || pin.length < 4}
              className="w-full bg-gradient-to-br from-[#c8a476] to-[#b8925e] hover:from-[#b8925e] hover:to-[#a8814d] text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[rgba(200,164,118,0.3)]"
            >
              {pinLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </span>
              ) : (
                'GUARDAR PIN'
              )}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Pendiente de aprobación — CON BOTÓN DE CANCELAR
  if (view === 'pending') {
    return (
      <main className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] p-4 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
            <Smartphone className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#2a2420] dark:text-white mb-3">
            ESPERANDO APROBACIÓN
          </h2>
          <p className="text-[rgba(42,36,32,0.62)] dark:text-espresso-400 text-sm leading-relaxed">
            Tu dispositivo está registrado pero pendiente de aprobación del dueño.
            Pídele que revise su panel de <strong>Gestionar empleados</strong> para darte acceso.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            <button
              onClick={checkDevice}
              className="px-6 py-3 bg-[rgba(200,164,118,0.15)] dark:bg-[#201b16] text-[#2a2420] dark:text-espresso-300 rounded-xl font-semibold hover:bg-[rgba(200,164,118,0.25)] dark:hover:bg-espresso-700 transition-colors"
            >
              Verificar estado
            </button>
            <button
              onClick={handleCancelar}
              className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancelar solicitud
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Acceso revocado
  if (view === 'revoked') {
    return (
      <main className="min-h-screen bg-[#fdfaf5] dark:bg-[#0d0b09] p-4 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
            <ShieldAlert className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#2a2420] dark:text-white mb-3">
            ACCESO REVOCADO
          </h2>
          <p className="text-[rgba(42,36,32,0.62)] dark:text-espresso-400 text-sm">
            El dueño ha revocado el acceso a este dispositivo. Contacta al dueño para más información.
          </p>
        </div>
      </main>
    )
  }

  // ── Opt-in de notificaciones push (una sola vez por dispositivo) ──────
  // Sin suscripciones no hay push que llegue (récord de ventas, stock,
  // fin de prueba). Se pide permiso una única vez, solo a dueños y solo
  // si aún no han decidido. Si aceptan, enablePushNotifications() suscribe
  // el dispositivo vía /api/push/subscribe (upsert por endpoint).
  useEffect(() => {
    if (view !== 'owner') return
    if (!isPushSupported() || getPushPermission() !== 'default') return
    const key = 'veliora_push_prompted'
    try { if (localStorage.getItem(key)) return } catch { return }
    const t = setTimeout(async () => {
      try { localStorage.setItem(key, '1') } catch { /* noop */ }
      await enablePushNotifications()
    }, 2500)
    return () => clearTimeout(t)
  }, [view])

  // Dueño o empleado aprobado -> HomePageContent
  return (
    <>
      {children}
      <HomePageContent
        role={view as 'owner' | 'employee'}
        userName={userName}
        boutiqueName={boutiqueName}
        showAdmin={view === 'owner'}
      />
    </>
  )
}
