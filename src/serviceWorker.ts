
// This optional code is used to register a service worker.
// This lets the app load faster on subsequent visits and gives it offline capabilities.

// Define the service worker specific event interface
type ExtendedEvent = Event & {
  waitUntil: (promise: Promise<any>) => void;
};

// Define interface for ClientType and Client
type ClientType = "window" | "worker" | "sharedworker" | "all";

interface ClientQueryOptions {
  includeUncontrolled?: boolean;
  type?: ClientType;
}

interface WindowClient {
  focused: boolean;
  visibilityState: DocumentVisibilityState;
  focus(): Promise<WindowClient>;
  navigate(url: string): Promise<WindowClient | null>;
}

// Define the Clients interface
interface Clients {
  claim(): Promise<void>;
  get(id: string): Promise<WindowClient | undefined>;
  matchAll(options?: ClientQueryOptions): Promise<WindowClient[]>;
  openWindow(url: string): Promise<WindowClient | null>;
}

// Define ServiceWorkerGlobalScope as a standalone interface with all necessary properties
interface ServiceWorkerGlobalScope {
  skipWaiting(): Promise<void>;
  clients: Clients;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  fetch: typeof fetch;
  caches: CacheStorage;
}

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
