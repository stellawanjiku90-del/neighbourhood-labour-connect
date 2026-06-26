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
let recaptchaVerifier = null;
let initPromise = null;

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

// ─── reCAPTCHA Management (Singleton) ─────────────────────────────

/**
 * Returns the existing RecaptchaVerifier, or creates one if none exists.
 * The verifier is reused for all subsequent sendPhoneCode() calls.
 * This prevents the "reCAPTCHA has already been rendered in this element"
 * error.
 */
export async function getRecaptchaVerifier(containerId = "recaptcha-container") {
  await getAuthInstance();

  // Reuse the existing verifier — never create a duplicate
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  // Clear the container DOM element before creating a new verifier
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";

  recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(containerId, {
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
  const verifier = await getRecaptchaVerifier(containerId);
  return auth.signInWithPhoneNumber(phone, verifier);
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