import { base44 } from "@/api/base44Client";

// ─── Firebase SDK (loaded via CDN compat scripts in index.html) ────
// The compat SDK exposes a global `window.firebase` object. We use it
// directly to avoid Vite dependency-optimization issues with the
// modular firebase/auth package.
//
// reCAPTCHA Best Practices (v9+ singleton pattern):
//   1. The RecaptchaVerifier is stored at module level (singleton).
//   2. getRecaptchaVerifier() reuses the existing verifier — it never
//      creates a duplicate for the same container.
//   3. clearRecaptchaVerifier() destroys the verifier on unmount or
//      when a fresh one is needed (e.g. after a reCAPTCHA error).
//   4. A single container element (#recaptcha-container) is used
//      throughout the auth flow.

let firebaseApp = null;
let authInstance = null;
let messagingInstance = null;
let initPromise = null;
let firebaseConfig = null;

function waitForFirebaseSdk() {
  return new Promise((resolve, reject) => {
    if (window.firebase) return resolve();
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      if (window.firebase) {
        clearInterval(interval);
        resolve();
      } else if (tries > 50) {
        clearInterval(interval);
        reject(new Error("Firebase SDK failed to load. Check your internet connection."));
      }
    }, 100);
  });
}

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
    firebaseConfig = config;
    await waitForFirebaseSdk();
    firebaseApp = window.firebase.initializeApp(config);
    return firebaseApp;
  })();
  return initPromise;
}

/** Returns the singleton Firebase Auth instance. */
export async function getAuthInstance() {
  if (authInstance) return authInstance;
  await initFirebase();
  authInstance = firebaseApp.auth();
  return authInstance;
}

/** Returns the singleton Firebase Messaging instance. */
export async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  await initFirebase();
  messagingInstance = firebaseApp.messaging();
  return messagingInstance;
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
  return auth.onAuthStateChanged(callback);
}

// ─── reCAPTCHA (standard Firebase invisible verifier) ─────────────
// Uses Firebase Authentication's built-in invisible RecaptchaVerifier.
// Firebase automatically uses whatever reCAPTCHA integration is
// configured in the Firebase Authentication console (Identity
// Platform) — no manual site keys or enterprise.js loading required.
// A single hidden container element is reused throughout the flow.

let recaptchaVerifier = null;

/** Ensures a DOM container exists for the invisible reCAPTCHA widget. */
function getRecaptchaContainer() {
  let el = document.getElementById("recaptcha-container");
  if (!el) {
    el = document.createElement("div");
    el.id = "recaptcha-container";
    el.style.display = "none";
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Returns the singleton standard Firebase invisible RecaptchaVerifier.
 * Firebase handles token generation and verification internally.
 */
export async function getRecaptchaVerifier() {
  if (recaptchaVerifier) return recaptchaVerifier;
  const auth = await getAuthInstance();
  getRecaptchaContainer();
  recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(
    "recaptcha-container",
    { size: "invisible" },
    auth
  );
  await recaptchaVerifier.render();
  return recaptchaVerifier;
}

/** Destroys the reCAPTCHA verifier singleton so a fresh one is created next time. */
export function clearRecaptchaVerifier() {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (e) { /* ignore */ }
  }
  recaptchaVerifier = null;
}

/**
 * Sends an SMS verification code to the given phone number using
 * Firebase's standard invisible reCAPTCHA verifier.
 */
export async function sendPhoneCode(phone) {
  const auth = await getAuthInstance();
  const verifier = await getRecaptchaVerifier();
  console.log("[Firebase] Sending SMS to", phone);
  try {
    return await auth.signInWithPhoneNumber(phone, verifier);
  } catch (err) {
    // A failed attempt consumes the verifier — reset so the next try works.
    clearRecaptchaVerifier();
    throw err;
  }
}

/** Signs out the current Firebase user and clears the reCAPTCHA verifier. */
export async function signOutFirebase() {
  const auth = await getAuthInstance();
  await auth.signOut();
  clearRecaptchaVerifier();
}

/** Returns an FCM registration token for push notifications. */
export async function getMessagingToken(vapidKey, serviceWorkerRegistration) {
  const messaging = await getMessagingInstance();
  return messaging.getToken({ vapidKey, serviceWorkerRegistration });
}