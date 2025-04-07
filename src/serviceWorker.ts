
// This optional code is used to register a service worker.
// This lets the app load faster on subsequent visits and gives it offline capabilities.

// Define the service worker specific event interface
type ExtendedEvent = Event & {
  waitUntil: (promise: Promise<any>) => void;
};

// This code executes in the service worker context
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendedEvent) => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients as soon as the service worker activates
      self.clients.claim(),
      // Delete outdated caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      })
    ])
  );
});

export {};
