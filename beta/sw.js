// The beta has been retired. This removes the old beta offline copy from phones.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // (Its saved files share storage with the main app, which tidies them up itself.)
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.navigate('../'));
  })());
});
