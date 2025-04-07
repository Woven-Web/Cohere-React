
// This optional code is used to register a service worker.
// This lets the app load faster on subsequent visits and gives it offline capabilities.

// Define the window interface with the service worker properties
declare global {
  interface Window {
    skipWaiting?: () => void;
    clients?: {
      claim: () => void;
    };
    registration?: ServiceWorkerRegistration;
  }
}

// This code executes in the service worker context
self.addEventListener('install', () => {
  if (self.skipWaiting) {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients as soon as the service worker activates
      self.clients?.claim(),
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
