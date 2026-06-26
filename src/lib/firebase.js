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

// ─── reCAPTCHA Enterprise ─────────────────────────────────────────
// Uses Google reCAPTCHA Enterprise (invisible, score-based) instead of
// the standard Firebase RecaptchaVerifier. The enterprise script is
// loaded in index.html. A custom verifier object implements Firebase's
// ApplicationVerifier interface (type + verify) so signInWithPhoneNumber
// can use the Enterprise token directly — no DOM container needed.

let enterpriseVerifier = null;
let enterpriseReadyPromise = null;

function loadRecaptchaEnterpriseScript(siteKey) {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha?.enterprise) return resolve();
    const existing = document.querySelector('script[src*="recaptcha/enterprise.js"]');
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA Enterprise script."));
    document.head.appendChild(script);
  });
}

/** Waits for grecaptcha.enterprise to be available on window. */
function waitForGrecaptcha() {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha?.enterprise) return resolve();
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      if (window.grecaptcha?.enterprise) {
        clearInterval(interval);
        resolve();
      } else if (tries > 50) {
        clearInterval(interval);
        reject(new Error("reCAPTCHA Enterprise failed to load."));
      }
    }, 100);
  });
}

/**
 * Returns the singleton Enterprise reCAPTCHA verifier — a plain object
 * implementing Firebase's ApplicationVerifier interface (type, verify,
 * render, clear). Compatible with auth.signInWithPhoneNumber().
 */
export async function getRecaptchaVerifier() {
  if (enterpriseVerifier) return enterpriseVerifier;
  if (enterpriseReadyPromise) {
    await enterpriseReadyPromise;
    return enterpriseVerifier;
  }
  enterpriseReadyPromise = (async () => {
    await initFirebase();
    const siteKey = firebaseConfig?.recaptchaEnterpriseSiteKey;
    if (!siteKey) {
      throw new Error("reCAPTCHA Enterprise site key is not configured. Set RECAPTCHA_ENTERPRISE_SITE_KEY in app secrets.");
    }
    await loadRecaptchaEnterpriseScript(siteKey);
    await waitForGrecaptcha();
    const verifier = {
      type: "recaptcha",
      async verify() {
        await waitForGrecaptcha();
        return new Promise((resolve, reject) => {
          window.grecaptcha.enterprise.ready(async () => {
            try {
              const token = await window.grecaptcha.enterprise.execute(
                firebaseConfig.recaptchaEnterpriseSiteKey,
                { action: "LOGIN" }
              );
              console.log("[Firebase] reCAPTCHA Enterprise token:", token ? "✓" : "✗");
              resolve(token);
            } catch (err) {
              console.error("[Firebase] reCAPTCHA Enterprise error:", err);
              reject(err);
            }
          });
        });
      },
      async render() {
        return 1; // Enterprise is invisible — no widget to render
      },
      clear() {
        // No-op — enterprise tokens are single-use, no widget to destroy
      },
      _reset() {
        // No-op — called by Firebase compat SDK after each verification.
        // Enterprise tokens are single-use; nothing to reset.
      },
    };
    console.log("[Firebase] reCAPTCHA Enterprise verifier ready");
    return verifier;
  })();
  try {
    enterpriseVerifier = await enterpriseReadyPromise;
    return enterpriseVerifier;
  } catch (err) {
    console.error("[Firebase] reCAPTCHA Enterprise setup failed:", err);
    enterpriseVerifier = null;
    throw new Error("Could not initialize reCAPTCHA. Please refresh the page.");
  } finally {
    enterpriseReadyPromise = null;
  }
}

/** Resets the Enterprise verifier singleton (no widget to destroy). */
export function clearRecaptchaVerifier() {
  if (enterpriseVerifier?.clear) {
    try { enterpriseVerifier.clear(); } catch (e) { /* ignore */ }
  }
  enterpriseVerifier = null;
  enterpriseReadyPromise = null;
}

/**
 * Sends an SMS verification code to the given phone number using
 * reCAPTCHA Enterprise for bot protection.
 */
export async function sendPhoneCode(phone) {
  const auth = await getAuthInstance();
  const verifier = await getRecaptchaVerifier();
  console.log("[Firebase] Sending SMS to", phone);
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