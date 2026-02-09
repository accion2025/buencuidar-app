// BuenCuidar - Service Worker (Optimizada para OneSignal + Workbox)

// 1. Cargar OneSignal SDK PRIMERO (Prioridad Crítica para evitar errores de postMessage)
if (typeof importScripts === 'function') {
    importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
}

// 2. Cargar Workbox después
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// 3. Configuración de Workbox
if (workbox) {
    console.log("Workbox cargado correctamente");

    // Limpieza de caches antiguos
    workbox.precaching.cleanupOutdatedCaches();

    // Precachear rutas inyectadas por VitePWA
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

    // Control inmediato
    self.skipWaiting();
    workbox.core.clientsClaim();
    console.log("Service Worker ha tomado el control de los clientes (BuenCuidar)");
} else {
    console.error("Fallo al cargar Workbox");
}

// 4. Fallback para comunicación de mensajes (Evita el error 'Could not get ServiceWorkerRegistration to postMessage')
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
