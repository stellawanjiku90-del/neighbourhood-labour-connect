// Firebase is used only for web push notifications in this standalone build.
// Firebase Authentication / Phone Auth has been completely removed.
let firebaseApp = null;
let messagingInstance = null;
let initPromise = null;

async function waitForFirebaseSdk() {
  if (typeof window !== 'undefined' && window.firebase) return;
  await new Promise((resolve, reject) => {
    let tries = 0;
    const interval = setInterval(() => {
      tries += 1;
      if (window.firebase) { clearInterval(interval); resolve(); }
      else if (tries > 50) { clearInterval(interval); reject(new Error('Push notification SDK failed to load.')); }
    }, 100);
  });
}

async function initFirebaseMessaging() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const response = await fetch('/api/config/public');
    const cfg = await response.json();
    if (!cfg?.firebase?.apiKey || !cfg?.firebase?.appId) throw new Error('Push notifications are not configured.');
    await waitForFirebaseSdk();
    firebaseApp = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(cfg.firebase);
    return firebaseApp;
  })();
  return initPromise;
}

export async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  await initFirebaseMessaging();
  messagingInstance = firebaseApp.messaging();
  return messagingInstance;
}

export async function getFirebaseConfig() {
  const response = await fetch('/api/config/public');
  const cfg = await response.json();
  return cfg.firebase || {};
}

export async function getMessagingToken(vapidKey, serviceWorkerRegistration) {
  const messaging = await getMessagingInstance();
  return messaging.getToken({ vapidKey, serviceWorkerRegistration });
}
