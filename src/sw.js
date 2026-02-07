// BuenCuidar - Service Worker Clásico (Máxima Compatibilidad)

// 1. Cargar Workbox desde CDN (Modo Clásico)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// 2. Cargar OneSignal SDK (Prioridad Alta)
if (typeof importScripts === 'function') {
    importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
}

// 3. Configuración de Workbox
if (workbox) {
    console.log("Workbox cargado correctamente");

    // Limpieza de caches antiguos
    workbox.precaching.cleanupOutdatedCaches();

    // Precachear rutas inyectadas por VitePWA
    // self.__WB_MANIFEST será inyectado por el plugin durante el build
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

    // Control inmediato
    self.skipWaiting();
    workbox.core.clientsClaim();
} else {
    console.error("Fallo al cargar Workbox desde el CDN");
}
