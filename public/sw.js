/// Service Worker for push notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/verify/result') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clientList.length > 0) {
        clientList[0].navigate('/verify/result');
        return clientList[0].focus();
      }
      return clients.openWindow('/verify/result');
    })
  );
});
