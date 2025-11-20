import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

// 1. Gestione Cache PWA standard
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2. Gestione Evento PUSH (Notifica dal server)
self.addEventListener('push', function(event) {
  const eventData = event.data ? event.data.json() : {};
  
  const title = eventData.head || 'KOR-35';
  const options = {
    body: eventData.body || 'Nuovo messaggio ricevuto.',
    icon: '/pwa-192x192.png', // Assicurati che l'icona esista in /public
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: { 
        url: eventData.url || '/' 
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 3. Gestione Click sulla Notifica (Apre l'app)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Apre la finestra relativa alla URL
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});