import { base44 } from "@/api/base44Client";

// ─── Firebase v9+ Modular SDK (loaded from CDN) ────────────────────
// We use dynamic imports from the gstatic CDN with @vite-ignore to
// bypass Vite's dependency optimizer (which fails for firebase/auth
// in this environment). This gives us the v9+ modular API without
// any npm bundling issues.

const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
const FIREBASE_AUTH_URL = "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const FIREBASE_MESSAGING_URL = "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";

let app = null;
let auth = null;
let messaging = null;
let recaptchaVerifier = null;
let initPromise = null;

/**
 * Initialises the Firebase app once (singleton). Config is fetched
 * from the getFirebaseConfig backend function which reads app secrets.
 */
async function initFirebase() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { data: config } = await base44.functions.invoke("getFirebaseConfig");
    if (!config || !config.apiKey || !config.appId) {
      throw new Error(
        "Firebase configuration is missing. Set FIREBASE_API_KEY and FIREBASE_APP_ID in your app secrets."
      );
    }
    const { initializeApp } = await import(/* @vite-ignore */ FIREBASE_APP_URL);
    app = initializeApp(config);
    return app;
  })();
  return initPromise;
}

/** Returns the singleton Firebase Auth instance. */
export async function getAuthInstance() {
  if (auth) return auth;
  await initFirebase();
  const { getAuth } = await import(/* @vite-ignore */ FIREBASE_AUTH_URL);
  auth = getAuth(app);
  return auth;
}

/** Returns the singleton Firebase Messaging instance. */
export async function getMessagingInstance() {
  if (messaging) return messaging;
  await initFirebase();
  const { getMessaging } = await import(/* @vite-ignore */ FIREBASE_MESSAGING_URL);
  messaging = getMessaging(app);
  return messaging;
}

/** Returns the Firebase config (fetched from backend). */
export async function getFirebaseConfig() {
  const { data } = await base44.functions.invoke("getFirebaseConfig");
  return data;
}

/**
 * Subscribes to Firebase auth state changes via onAuthStateChanged.
 * Returns an unsubscribe function.
 */
export async function subscribeAuthState(callback) {
  const auth = await getAuthInstance();
  const { onAuthStateChanged } = await import(/* @vite-ignore */ FIREBASE_AUTH_URL);
  return onAuthStateChanged(auth, callback);
}

// ─── reCAPTCHA Management (Singleton) ─────────────────────────────
// The reCAPTCHA verifier is stored at module level so it is created
// only once and reused across re-renders and repeated sendCode()
// calls. This prevents the "reCAPTCHA has already been rendered in
// this element" error.

/**
 * Returns the existing RecaptchaVerifier, or creates one if none exists.
 * The verifier is reused for all subsequent sendPhoneCode() calls.
 */
export async function getRecaptchaVerifier(containerId = "recaptcha-container") {
  const auth = await getAuthInstance();
  const { RecaptchaVerifier } = await import(/* @vite-ignore */ FIREBASE_AUTH_URL);

  // Reuse the existing verifier — never create a duplicate
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  // Clear the container DOM element before creating a new verifier
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });
  return recaptchaVerifier;
}

/**
 * Clears and destroys the current RecaptchaVerifier.
 * Call this on component unmount or when a fresh verifier is needed
 * (e.g. after a reCAPTCHA error).
 */
export function clearRecaptchaVerifier() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      // verifier may already be cleared
    }
    recaptchaVerifier = null;
  }
}

/**
 * Sends an SMS verification code to the given phone number.
 * Reuses the singleton RecaptchaVerifier — does NOT create a new one
 * on repeated calls.
 */
export async function sendPhoneCode(phone, containerId = "recaptcha-container") {
  const auth = await getAuthInstance();
  const { signInWithPhoneNumber } = await import(/* @vite-ignore */ FIREBASE_AUTH_URL);
  const verifier = await getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(auth, phone, verifier);
}

/** Signs out the current Firebase user and clears the reCAPTCHA verifier. */
export async function signOutFirebase() {
  const auth = await getAuthInstance();
  const { signOut } = await import(/* @vite-ignore */ FIREBASE_AUTH_URL);
  await signOut(auth);
  clearRecaptchaVerifier();
}

/** Returns an FCM registration token for push notifications. */
export async function getMessagingToken(vapidKey, serviceWorkerRegistration) {
  const messaging = await getMessagingInstance();
  const { getToken } = await import(/* @vite-ignore */ FIREBASE_MESSAGING_URL);
  return getToken(messaging, { vapidKey, serviceWorkerRegistration });
}