const CACHE_NAME = 'ecotrack-v3';
const ASSETS = ['/', '/index.html', '/dashboard.html', '/calculator.html', '/css/style.css', '/js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// Push from server (future use)
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.title || 'EcoTrack AI 🌿', {
    body: d.body || "Don't forget to log your carbon footprint!",
    icon: '/logo.png', badge: '/logo.png',
    tag: d.tag || 'ecotrack-reminder', renotify: true,
    actions: [{ action: 'open', title: '📊 Open App' }, { action: 'dismiss', title: 'Later' }],
    data: { url: d.url || '/calculator.html' }
  }));
});

// Triggered from app via postMessage
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SHOW_REMINDER') {
    self.registration.showNotification(e.data.title || 'EcoTrack AI 🌿', {
      body: e.data.body || 'Check your EcoTrack app!',
      icon: '/logo.png', badge: '/logo.png',
      tag: e.data.tag || 'ecotrack-reminder', renotify: true,
      actions: [{ action: 'open', title: '📊 Open App' }, { action: 'dismiss', title: 'Later' }],
      data: { url: '/calculator.html' }
    });
  }
});

// Notification click → open/focus app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = (e.notification.data && e.notification.data.url) || '/calculator.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) { c.focus(); c.navigate(url); return; }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
