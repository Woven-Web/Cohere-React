
// This optional code is used to register a service worker.
// This lets the app load faster on subsequent visits and gives it offline capabilities.

// Define the service worker specific event interface
type ExtendedEvent = Event & {
  waitUntil: (promise: Promise<any>) => void;
};

// Define WindowOrWorkerGlobalScope interface first
interface WindowOrWorkerGlobalScope {
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  fetch: typeof fetch;
  caches: CacheStorage;
}

// Add the missing type definitions for ServiceWorkerGlobalScope and Clients
interface Clients {
  claim(): Promise<void>;
  get(id: string): Promise<Client | undefined>;
  matchAll(options?: ClientQueryOptions): Promise<Client[]>;
  openWindow(url: string): Promise<WindowClient | null>;
}

interface ClientQueryOptions {
  includeUncontrolled?: boolean;
  type?: ClientType;
}

type ClientType = "window" | "worker" | "sharedworker" | "all";
type Client = WindowClient | Worker | SharedWorker;

interface WindowClient extends Client {
  focused: boolean;
  visibilityState: DocumentVisibilityState;
  focus(): Promise<WindowClient>;
  navigate(url: string): Promise<WindowClient | null>;
}

// Properly define ServiceWorkerGlobalScope as its own interface
interface ServiceWorkerGlobalScope {
  skipWaiting(): Promise<void>;
  clients: Clients;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  // Include WindowOrWorkerGlobalScope properties
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
