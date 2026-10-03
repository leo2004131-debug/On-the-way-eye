/* 《順路眼》Service Worker — 離線快取 */
const CACHE_VERSION = 'ontheway-v4';

// App Shell：首次安裝時預先快取的核心資源
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/app.html',
    '/register.html',
    '/404.html',
    '/css/style.css',
    '/js/firebase-config.js',
    '/js/common.js',
    '/js/app.js',
    '/js/auth.js',
    '/js/map.js',
    '/js/tasks.js',
    '/js/profile.js',
    '/js/wallet.js',
    // 外部 CDN
    'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// ── 安裝：預先下載 App Shell ──
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()) // 立刻啟用新版
    );
});

// ── 啟用：清除舊版快取 ──
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim()) // 立刻接管所有頁面
    );
});

// ── 攔截請求 ──
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 不攔截 Firestore API 請求（讓資料永遠走即時網路）
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebase') && url.pathname.includes('/documents')) {
        return;
    }

    // HTML 頁面 → Network First（優先拿最新版，離線才用快取）
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request) || caches.match('/index.html'))
        );
        return;
    }

    // CSS / JS / 外部 CDN → Stale While Revalidate（秒開 + 背景偷更新）
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached); // 網路失敗就回傳快取

            return cached || fetchPromise;
        })
    );
});
