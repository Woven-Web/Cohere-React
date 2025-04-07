
// This service worker can be customized further
// See https://developers.google.com/web/tools/workbox/

self.addEventListener('install', (event: any) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported
      if ('navigationPreload' in self.registration) {
        await (self.registration as any).navigationPreload.enable();
      }
      
      // Tell the active service worker to take control of the page immediately
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event: any) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    (async () => {
      try {
        // Try to use the navigation preload response if it's supported
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }
        
        // Always fetch from network for now
        return await fetch(event.request);
      } catch (error) {
        // If network request fails, return a fallback
        return new Response('Network error happened', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })()
  );
});
