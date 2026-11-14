const CACHE_NAME = "manfred-welchs-cache-v6";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app-upgrade.css",
  "./animations.css",
  "./coach.css",
  "./brand.css",
  "./menu.css",
  "./timer.css",
  "./storage.js",
  "./calculations.js",
  "./dashboard.js",
  "./sell.js",
  "./expenses.js",
  "./reports.js",
  "./coach.js",
  "./ai-coach.js",
  "./customers.js",
  "./timer.js",
  "./settings.js",
  "./main.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});