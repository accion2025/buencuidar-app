// Unificar OneSignal con el Worker de la PWA (Prioridad Alta)
if (typeof importScripts === 'function') {
    importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
}

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()
