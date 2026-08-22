import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Reglas propias PRIMERO (la primera coincidencia gana sobre defaultCache):
  // /api/* NUNCA se cachea — datos y auth siempre frescos (defaultCache
  // cacheaba GETs de /api/* por 24h y servía datos viejos).
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) =>
        sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          // Solo mostrar "Sin conexión" cuando el navegador realmente no tiene red.
          // Si hay internet, un fallo transitorio de fetch NO debe mostrar offline.
          return (
            request.destination === "document" &&
            typeof self !== "undefined" &&
            typeof self.navigator !== "undefined" &&
            self.navigator.onLine === false
          );
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ─── Notificaciones push (recordatorios fuera de la app) ───

interface PushData {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener("push", (event: PushEvent) => {
  let data: PushData = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() || "Tienes una notificación" };
  }

  const title = data.title || "Veliora";
  const options: NotificationOptions = {
    body: data.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "veliora-reminder",
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const target = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Si ya hay una ventana abierta, enfocarla y navegar; si no, abrir una nueva
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client && target.startsWith("/")) {
            (client as WindowClient).navigate(target);
          }
          return;
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
