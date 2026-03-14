/* ===================================================
   EcoTrack AI – Service Worker (sw.js)
   FIXED: Reliable notifications via Periodic Sync
   + IndexedDB + fallback setInterval
   =================================================== */

const CACHE_NAME = 'ecotrack-v4';
const ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/calculator.html',
    '/history.html',
    '/recommendations.html',
    '/leaderboard.html',
    '/offset.html',
    '/css/style.css',
    '/css/dashboard.css',
    '/js/app.js'
];

// ── INSTALL ───────────────────────────────────────────
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
              .then(c => c.addAll(ASSETS).catch(() => {}))
    );
    self.skipWaiting();
});

// ── ACTIVATE ──────────────────────────────────────────
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ── FETCH (Cache First) ───────────────────────────────
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
              .then(r => r || fetch(e.request))
    );
});

// ── PERIODIC SYNC (fires even when tab is CLOSED) ─────
// This is the MAIN fix — works in background
self.addEventListener('periodicsync', async e => {
    if (e.tag === 'ecotrack-daily-reminder') {
        e.waitUntil(checkAndFireReminder());
    }
});

// ── MESSAGE from app.js (tab is open fallback) ────────
self.addEventListener('message', e => {
    if (!e.data) return;

    if (e.data.type === 'SHOW_REMINDER') {
        // Called from setInterval fallback in app.js
        self.registration.showNotification(
            e.data.title || 'EcoTrack AI 🌿',
            {
                body    : e.data.body    || "Don't forget to log your carbon footprint!",
                icon    : '/logo.png',
                badge   : '/logo.png',
                tag     : e.data.tag    || 'ecotrack-reminder',
                renotify: true,
                actions : [
                    { action: 'open',    title: '📊 Log Now' },
                    { action: 'dismiss', title: 'Later'      }
                ],
                data: { url: '/calculator.html' }
            }
        );
    }

    if (e.data.type === 'SHOW_CHALLENGE') {
        self.registration.showNotification(
            e.data.title || 'EcoTrack Challenge 🎯',
            {
                body    : e.data.body || 'Check your active challenge!',
                icon    : '/logo.png',
                badge   : '/logo.png',
                tag     : e.data.tag  || 'ecotrack-challenge',
                renotify: true,
                actions : [
                    { action: 'open',    title: '🎯 View Challenge' },
                    { action: 'dismiss', title: 'Later'             }
                ],
                data: { url: '/recommendations.html' }
            }
        );
    }
});

// ── CORE: Check settings and fire notification ─────────
async function checkAndFireReminder() {
    const settings = await getSettingsFromDB();

    // Nothing to do if disabled or not set
    if (!settings || !settings.enabled) return;

    const now   = new Date();
    const hhmm  = now.getHours().toString().padStart(2, '0')
                + ':' + now.getMinutes().toString().padStart(2, '0');
    const today = now.toISOString().split('T')[0];

    // Don't fire twice on same day
    if (settings.lastFired === today) return;

    // Allow ±5 minute window because periodic sync is not exact
    if (!isWithinWindow(hhmm, settings.time, 5)) return;

    // ✅ Fire the notification
    await self.registration.showNotification('EcoTrack AI 🌿', {
        body    : settings.message || "Don't forget to log your carbon footprint today!",
        icon    : '/logo.png',
        badge   : '/logo.png',
        tag     : 'ecotrack-daily',
        renotify: true,
        vibrate : [200, 100, 200],
        actions : [
            { action: 'open',    title: '📊 Log Now' },
            { action: 'dismiss', title: 'Later'      }
        ],
        data: { url: '/calculator.html' }
    });

    // Save last fired date so it won't repeat today
    settings.lastFired = today;
    await saveSettingsToDB(settings);
}

// ── HELPER: Check if current time is within N mins of target ──
function isWithinWindow(current, target, windowMins) {
    const toMins = t => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const diff = Math.abs(toMins(current) - toMins(target));
    // Also handle midnight wrap-around e.g. 23:58 vs 00:02
    return diff <= windowMins || (1440 - diff) <= windowMins;
}

// ── IndexedDB INSIDE Service Worker ──────────────────
// Service Workers CANNOT use localStorage — must use IndexedDB

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('ecotrack_db', 1);

        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

async function getSettingsFromDB() {
    try {
        const db = await openDB();
        return new Promise(resolve => {
            const req = db
                .transaction('settings', 'readonly')
                .objectStore('settings')
                .get('reminder');
            req.onsuccess = e => resolve(e.target.result ? e.target.result.value : null);
            req.onerror   = ()  => resolve(null);
        });
    } catch {
        return null;
    }
}

async function saveSettingsToDB(data) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('settings', 'readwrite');
            tx.objectStore('settings').put({ key: 'reminder', value: data });
            tx.oncomplete = resolve;
            tx.onerror    = reject;
        });
    } catch {
        // Fail silently
    }
}

// ── NOTIFICATION CLICK → Open / Focus App ─────────────
self.addEventListener('notificationclick', e => {
    e.notification.close();

    if (e.action === 'dismiss') return;

    const url = e.notification.data?.url || '/calculator.html';

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
               .then(list => {
                    // Focus existing tab if open
                    for (const c of list) {
                        if (c.url.includes(self.location.origin) && 'focus' in c) {
                            c.focus();
                            c.navigate(url);
                            return;
                        }
                    }
                    // Otherwise open new tab
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
               })
    );
});

// ── PUSH from server (future Twilio/FCM integration) ──
self.addEventListener('push', e => {
    const d = e.data ? e.data.json() : {};
    e.waitUntil(
        self.registration.showNotification(d.title || 'EcoTrack AI 🌿', {
            body    : d.body  || "Don't forget to log your carbon footprint!",
            icon    : '/logo.png',
            badge   : '/logo.png',
            tag     : d.tag   || 'ecotrack-push',
            renotify: true,
            actions : [
                { action: 'open',    title: '📊 Open App' },
                { action: 'dismiss', title: 'Later'       }
            ],
            data: { url: d.url || '/calculator.html' }
        })
    );
});
