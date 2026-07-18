/**
 * Veliora WhatsApp Worker
 * 
 * Servicio independiente que mantiene conexión persistente con WhatsApp Web
 * usando Baileys (gratuito, sin costos por mensaje).
 * 
 * Despliegue recomendado: Railway (free tier) o Render (free)
 * 
 * API que expone:
 *   POST /send - Enviar un mensaje a un número
 *   GET  /qr   - Ver QR para escanear (HTML)
 *   GET  /status - Estado de la conexión
 */

require('dotenv').config()
const express = require('express')
const { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const cron = require('node-cron')
const fs = require('fs')
const path = require('path')
const http = require('http')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3001
const AUTH_DIR = path.join(__dirname, 'auth_info')
const VELIORA_API = process.env.VELIORA_API_URL || 'http://localhost:3000'

// ============================================================
// Estado global
// ============================================================
let sock = null
let connectionState = 'disconnected'
let qrCodeString = null
let lastQRTime = 0

// ============================================================
// Función para iniciar/reconectar el socket de WhatsApp
// ============================================================
async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)

  sock = makeWASocket({
    auth: state,
    browser: Browsers.windows('Veliora'),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    defaultQueryTimeoutMs: 30000,
  })

  connectionState = 'connecting'

  // ---- Manejar QR ----
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      qrCodeString = qr
      lastQRTime = Date.now()
      console.log('📱 Nuevo QR generado (válido por 60s)')
    }

    if (connection === 'open') {
      connectionState = 'connected'
      qrCodeString = null
      const phone = sock.user?.id?.split(':')[0] || 'desconocido'
      console.log(`✅ WhatsApp conectado: ${phone}`)

      // Enviar mensaje de confirmación al dueño
      try {
        const adminNumber = process.env.ADMIN_WHATSAPP
        if (adminNumber) {
          await sendMessage(adminNumber, '🟢 *Veliora Activo*\n\nSistema de alertas WhatsApp conectado exitosamente. Recibirás notificaciones de inventario aquí.')
        }
      } catch (e) {
        console.error('Error enviando confirmación:', e.message)
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output.statusCode
        : 0

      connectionState = 'disconnected'
      console.log(`❌ Conexión cerrada (código: ${statusCode})`)

      // Reconectar automáticamente (excepto logout explícito)
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) {
        console.log('🔄 Reconectando en 5 segundos...')
        setTimeout(startSocket, 5000)
      } else {
        console.log('🚫 Session expirada. Eliminar auth_info/ y reiniciar para nuevo QR.')
        // Borrar auth data para forzar nuevo QR
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true })
        } catch (e) { /* ignore */ }
      }
    }
  })

  // ---- Guardar credenciales ----
  sock.ev.on('creds.update', saveCreds)

  // ---- Escuchar mensajes entrantes (para comandos del dueño) ----
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message?.conversation) {
        const text = msg.message.conversation.toLowerCase().trim()
        const from = msg.key.remoteJid

        if (text === 'veliora status') {
          await sock.sendMessage(from, {
            text: `📊 *Veliora Status*\n\n🔌 Conexión: Activa\n📱 Número: ${sock.user?.id?.split(':')[0] || 'N/A'}\n⏰ Último check: ${new Date().toLocaleString('es-MX')}`
          })
        }
      }
    }
  })

  // ---- Verificar conexión periódicamente ----
  setInterval(() => {
    if (connectionState === 'connected' && sock?.ws?.readyState === 3) {
      console.log('⚠️ WebSocket cerrado inesperadamente. Reconectando...')
      connectionState = 'disconnected'
      startSocket()
    }
  }, 30000)
}

// ============================================================
// Función para enviar mensaje
// ============================================================
async function sendMessage(to, text) {
  if (!sock || connectionState !== 'connected') {
    throw new Error('WhatsApp no conectado')
  }

  // Formatear número: eliminar cualquier caracter no dígito, agregar @s.whatsapp.net
  const cleanNumber = to.replace(/[^\d]/g, '')
  const jid = `${cleanNumber}@s.whatsapp.net`

  await sock.sendMessage(jid, { text })
  console.log(`📤 Mensaje enviado a ${cleanNumber}: ${text.substring(0, 50)}...`)
}

// ============================================================
// API Endpoints
// ============================================================

// ---- Enviar mensaje ----
app.post('/send', async (req, res) => {
  try {
    const { to, text } = req.body

    if (!to || !text) {
      return res.status(400).json({ error: 'Faltan campos: to, text' })
    }
    if (connectionState !== 'connected') {
      return res.status(503).json({ error: 'WhatsApp no conectado', state: connectionState })
    }

    await sendMessage(to, text)
    res.json({ success: true })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: error.message })
  }
})

// ---- Enviar múltiples mensajes (batch) ----
app.post('/send-batch', async (req, res) => {
  try {
    const { messages } = req.body
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Se requiere array messages' })
    }

    const results = []
    for (const msg of messages) {
      try {
        await sendMessage(msg.to, msg.text)
        results.push({ to: msg.to, success: true })
      } catch (e) {
        results.push({ to: msg.to, success: false, error: e.message })
      }
    }

    res.json({ success: true, results })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ---- Generar/recibir alerta de Veliora ----
app.post('/alert', async (req, res) => {
  try {
    const { type, boutique, data } = req.body
    const adminNumber = process.env.ADMIN_WHATSAPP
    if (!adminNumber) {
      return res.status(400).json({ error: 'ADMIN_WHATSAPP no configurado' })
    }

    let text = ''
    switch (type) {
      case 'critical_stock':
        text = `⚠️ *ALERTA: STOCK CRÍTICO*\n\n*${boutique}*\n\n${data.products.map(p => `• ${p.name}: SOLO ${p.stock} uds`).join('\n')}\n\nReabastece antes de perder ventas.`
        break
      case 'dead_stock':
        text = `💡 *TIPS: PRODUCTOS PARADOS*\n\n*${boutique}*\n\n${data.products.map(p => `• ${p.name}: ${p.stock} uds ($${p.value} congelados)`).join('\n')}\n\nSugerencia: ${data.suggestion}`
        break
      case 'weekly_summary':
        text = `📊 *RESUMEN SEMANAL*\n\n*${boutique}*\n\n${data.summary}`
        break
      default:
        text = `📢 *${boutique}*\n\n${data.message || 'Notificación de Veliora'}`
    }

    await sendMessage(adminNumber, text)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ---- Ver QR en HTML ----
app.get('/qr', (req, res) => {
  if (connectionState === 'connected') {
    return res.send(`
      <html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0a0a0f;color:white;">
        <div style="text-align:center">
          <h2>✅ WhatsApp Conectado</h2>
          <p>Número: ${sock?.user?.id?.split(':')[0] || 'N/A'}</p>
          <p>Estado: ${connectionState}</p>
        </div>
      </body></html>
    `)
  }

  if (!qrCodeString) {
    // Generar nuevo QR si no hay
    res.send(`
      <html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0a0a0f;color:white;">
        <div style="text-align:center">
          <h2>⌛ Generando QR...</h2>
          <p>Espera unos segundos y recarga.</p>
          <meta http-equiv="refresh" content="3">
        </div>
      </body></html>
    `)
    return
  }

  try {
    const QRCode = require('qrcode')
    QRCode.toDataURL(qrCodeString, { width: 400, margin: 2 }, (err, url) => {
      if (err) return res.status(500).send('Error generando QR')
      res.send(`
        <html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0a0a0f;color:white;flex-direction:column;">
          <div style="text-align:center;max-width:500px">
            <div style="margin-bottom:24px;">
              <span style="font-size:28px;font-weight:bold;letter-spacing:0.02em;">Veliora</span>
              <span style="font-size:12px;color:#22d3ee;">.lat</span>
            </div>
            <h2 style="margin-bottom:8px;">Escanea para conectar WhatsApp</h2>
            <p style="color:#9ca3af;margin-bottom:24px;">
              Abre WhatsApp en tu teléfono → Menú → WhatsApp Web → Escanea este código
            </p>
            <img src="${url}" style="border-radius:12px;border:2px solid rgba(255,255,255,0.1);" />
            <p style="color:#6b7280;font-size:12px;margin-top:16px;">
              Este QR expira en 60 segundos. Recarga si expira.
            </p>
            <meta http-equiv="refresh" content="15">
          </div>
        </body></html>
      `)
    })
  } catch (e) {
    res.status(500).send('Error: ' + e.message)
  }
})

// ---- Status ----
app.get('/status', (req, res) => {
  res.json({
    state: connectionState,
    connected: connectionState === 'connected',
    phone: sock?.user?.id?.split(':')[0] || null,
    uptime: process.uptime(),
    hasQR: !!qrCodeString,
  })
})

// ---- Health check ----
app.get('/health', (req, res) => {
  res.json({ status: 'ok', state: connectionState })
})

// ============================================================
// Programar alertas periódicas (cron)
// ============================================================

// Resumen diario a las 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Ejecutando alerta diaria programada...')
  try {
    // Consultar Veliora API para obtener alertas
    const response = await fetch(`${VELIORA_API}/api/whatsapp-alert`)
    if (!response.ok) return
    const data = await response.json()
    // data = { alerts: [{ type, boutique, data }] }

    if (data.alerts?.length > 0) {
      const adminNumber = process.env.ADMIN_WHATSAPP
      if (!adminNumber) return

      for (const alert of data.alerts) {
        // Re-enviar al endpoint /alert local
        await fetch(`http://localhost:${PORT}/alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      }
    }
  } catch (e) {
    console.error('Error en alerta programada:', e.message)
  }
}, {
  scheduled: true,
  timezone: 'America/Mexico_City'
})

// ============================================================
// Iniciar
// ============================================================
async function main() {
  console.log('🚀 Iniciando Veliora WhatsApp Worker...')
  console.log(`📡 Puerto: ${PORT}`)
  console.log(`🏪 Veliora API: ${VELIORA_API}`)

  // Crear directorio de auth si no existe
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true })
  }

  // Iniciar Baileys
  await startSocket()

  // Servidor HTTP
  app.listen(PORT, () => {
    console.log(`🌐 Servidor listo en http://localhost:${PORT}`)
    console.log(`📱 Escanea el QR: http://localhost:${PORT}/qr`)
    console.log(`🔍 Status: http://localhost:${PORT}/status`)
  })
}

main().catch(console.error)
