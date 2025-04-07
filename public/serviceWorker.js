
// This is a minimal service worker for the PWA.
// It's loaded from the main.tsx file.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Minimal fetch handler - can be expanded with caching strategies
self.addEventListener('fetch', (event) => {
  // For simplicity, we're just using a network-first strategy
  // This can be enhanced with proper caching in the future
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('You are offline. Please check your connection.');
    })
  );
});
