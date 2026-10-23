importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

fetch('/api/config/public').then(r=>r.json()).then(cfg=>{
  if(!cfg.firebase) return;
  firebase.initializeApp(cfg.firebase);
  const messaging=firebase.messaging();
  messaging.onBackgroundMessage(payload=>{
    const {title,body}=payload.notification||{};
    self.registration.showNotification(title||'Neighbourhood Labour Connect',{body:body||'',icon:'/icon.svg',badge:'/icon.svg',tag:'nlc-notification'});
  });
}).catch(()=>{});
