import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

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
  runtimeCaching: defaultCache,
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
