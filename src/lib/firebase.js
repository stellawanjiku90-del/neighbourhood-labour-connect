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
    console.log("[Firebase] initializeApp() config:", {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
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

/**
 * Returns a brand-new hidden container element, replacing any
 * previous one. This destroys any stale reCAPTCHA DOM bindings
 * that `innerHTML = ""` cannot clear, guaranteeing a clean host for
 * RecaptchaVerifier.
 */
function getRecaptchaContainer() {
  // Remove the old element (and any invisible iframe + grecaptcha
  // binding attached to it) entirely.
  const old = document.getElementById("recaptcha-container");
  if (old) old.remove();

  const el = document.createElement("div");
  el.id = "recaptcha-container";
  el.style.display = "none";
  document.body.appendChild(el);
  return el;
}

/**
 * Returns the singleton standard Firebase invisible RecaptchaVerifier.
 * Firebase handles token generation and verification internally.
 */
export async function getRecaptchaVerifier(forceReset = false) {
  if (recaptchaVerifier && !forceReset) return recaptchaVerifier;
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (__) { /* ignore */ }
    recaptchaVerifier = null;
  }
  const auth = await getAuthInstance();
  getRecaptchaContainer();
  try {
    recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(
      "recaptcha-container",
      { size: "invisible" }
    );
    await recaptchaVerifier.render();
  } catch (e) {
    // On "already rendered" the host has a stale bindings the SDK
    // won't overwrite — nuke and recreate the element entirely.
    try { document.getElementById("recaptcha-container")?.remove(); } catch (_) { /* ignore */ }
    throw e;
  }
  return recaptchaVerifier;
}

/** Destroys the reCAPTCHA verifier singleton so a fresh one is created next time. */
export function clearRecaptchaVerifier() {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (e) { /* ignore */ }
  }
  recaptchaVerifier = null;
  const el = document.getElementById("recaptcha-container");
  if (el) el.innerHTML = "";
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