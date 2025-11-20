// src/sw.js
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

// 1. Gestione Cache standard (PWA)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2. Gestione Evento PUSH (Notifica dal server)
self.addEventListener('push', function(event) {
  const eventData = event.data ? event.data.json() : {};
  
  const title = eventData.head || 'Nuovo messaggio KOR-35';
  const options = {
    body: eventData.body || 'Hai ricevuto una nuova notifica.',
    icon: eventData.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: eventData.url || '/' } // URL da aprire al click
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 3. Gestione Click sulla Notifica
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});