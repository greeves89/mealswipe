// Forkly Service Worker v2 — Enhanced Offline Mode
const VERSION = "forkly-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE = `${VERSION}-api`;
const IMAGE_CACHE = `${VERSION}-images`;

// App shell: pages and static assets that form the offline skeleton
const SHELL_ASSETS = [
  "/",
  "/app",
  "/app/swipe",
  "/app/recipes",
  "/app/plan",
  "/app/shopping",
  "/app/lager",
  "/app/profile",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// API routes to cache (network-first with stale fallback)
const CACHEABLE_API_PREFIXES = [
  "/api/recipes",
  "/api/custom-recipes",
  "/api/pantry",
  "/api/reactions",
  "/api/meal-plans",
  "/api/shopping",
  "/api/plan-templates",
  "/api/profile",
  "/api/auth/me",
  "/api/frozen",
  "/api/household",
];

const MAX_IMAGE_ENTRIES = 150;
const MAX_API_ENTRIES = 80;

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll may fail for dynamic routes — that's OK
      Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// ── Activate: clean up old version caches ────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCacheableApi(pathname) {
  return CACHEABLE_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function isSkippedApi(pathname) {
  return (
    pathname.startsWith("/api/auth/signout") ||
    pathname.startsWith("/api/auth/callback") ||
    pathname.startsWith("/api/stripe") ||
    pathname.startsWith("/api/scan") ||
    pathname.startsWith("/api/import-url") ||
    pathname.startsWith("/api/barcode-lookup") ||
    pathname.startsWith("/api/feedback")
  );
}

function isImage(url) {
  return (
    /\.(png|jpg|jpeg|webp|gif|svg|ico)$/i.test(url.pathname) ||
    url.hostname.includes("img.spoonacular.com") ||
    url.hostname.includes("images.unsplash.com") ||
    url.hostname.includes("cloudinary.com") ||
    url.hostname.includes("openfoodfacts.org")
  );
}

function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(woff2?|ttf|otf|eot)$/.test(url.pathname)
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

// ── Fetch handler ─────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Allow cross-origin images from known CDNs
  if (!isSameOrigin && !isImage(url)) return;

  // ── Images: cache-first (long-lived content) ──────────────────────────────
  if (isImage(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) {
            cache.put(request, res.clone());
            trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
          }
          return res;
        } catch {
          return new Response("", { status: 503 });
        }
      })
    );
    return;
  }

  // ── Immutable static chunks: cache-first ─────────────────────────────────
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return new Response("", { status: 503 });
        }
      })
    );
    return;
  }

  // ── Skip volatile/non-cacheable API routes ────────────────────────────────
  if (url.pathname.startsWith("/api/") && isSkippedApi(url.pathname)) return;

  // ── Cacheable API: network-first, 5s timeout, stale fallback ─────────────
  if (url.pathname.startsWith("/api/") && isCacheableApi(url.pathname)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(request.clone(), { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            cache.put(request, res.clone());
            trimCache(API_CACHE, MAX_API_ENTRIES);
          }
          return res;
        } catch {
          clearTimeout(timer);
          const cached = await cache.match(request);
          if (cached) {
            // Add header so client can show "offline" indicator if desired
            const headers = new Headers(cached.headers);
            headers.set("X-Served-From-Cache", "true");
            const body = await cached.clone().arrayBuffer();
            return new Response(body, { status: cached.status, headers });
          }
          return new Response(
            JSON.stringify({ error: "offline", offline: true }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
      })
    );
    return;
  }

  // ── Navigation (HTML pages): network-first, offline shell fallback ────────
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          // Try exact URL, then closest parent app route, then root
          const cached =
            (await cache.match(request)) ||
            (await cache.match(url.pathname.startsWith("/app") ? "/app" : "/")) ||
            new Response(
              `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Forkly – Offline</title><style>body{font-family:system-ui,sans-serif;background:#080f1e;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;gap:1rem}h1{font-size:2rem;font-weight:900}p{color:#64748b}button{background:#14b8a6;color:#fff;border:none;padding:.75rem 2rem;border-radius:1rem;font-size:1rem;font-weight:700;cursor:pointer}</style></head><body><span style="font-size:3rem">🍴</span><h1>Du bist offline</h1><p>Forkly lädt sobald du wieder verbunden bist.</p><button onclick="location.reload()">Erneut versuchen</button></body></html>`,
              { headers: { "Content-Type": "text/html" } }
            );
          return cached;
        }
      })()
    );
    return;
  }
});

// ── Message: force cache refresh ─────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CLEAR_API_CACHE") {
    caches.delete(API_CACHE).then(() =>
      event.source?.postMessage({ type: "API_CACHE_CLEARED" })
    );
  }
});
