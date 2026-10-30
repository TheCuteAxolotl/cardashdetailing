/* Car Dash notification display worker.
   Used for user-authorized notifications while the owner dashboard is open.
   Background push delivery is not enabled until server VAPID push is configured. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path=event.notification.data && event.notification.data.url;
  const safe=typeof path==="string" && /^\/(owner|admin)\/[a-z0-9/?=&%+.-]*$/i.test(path) ? path : "/owner/dashboard";
  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows) {
      if(new URL(client.url).origin===self.location.origin) {
        await client.focus();
        if("navigate" in client) await client.navigate(safe);
        return;
      }
    }
    await clients.openWindow(safe);
  })());
});
