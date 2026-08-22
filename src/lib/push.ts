import webpush from 'web-push';

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

let initialized = false;

function ensureVapid() {
  if (initialized) return;
  if (PUBLIC_KEY && PRIVATE_KEY) {
    webpush.setVapidDetails('mailto:soporte@veliora.lat', PUBLIC_KEY, PRIVATE_KEY);
    initialized = true;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  /** Tag único por notificación (evita que avisos distintos se pisen). */
  tag?: string;
}

/**
 * Envía una notificación push a una suscripción.
 * Devuelve true si se envió (o error transitorio), false si la suscripción murió (404/410).
 */
export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<boolean> {
  ensureVapid();
  if (!initialized) {
    console.error('VAPID keys no configuradas');
    return false;
  }
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    // 404/410 = suscripción expirada o cancelada → eliminar
    if (err.statusCode === 404 || err.statusCode === 410) return false;
    console.error('Push send error:', err.message);
    return true; // no eliminar en errores transitorios
  }
}
