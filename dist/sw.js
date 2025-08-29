self.addEventListener('push', (e) => {
    const data = e.data?.json() || { title: 'New message' };
    e.waitUntil(self.registration.showNotification(data.title, {
      body: data.body, 
      icon: '/icon.png', 
      data: { url: data.url }
    }));
  });
  
  self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
  });