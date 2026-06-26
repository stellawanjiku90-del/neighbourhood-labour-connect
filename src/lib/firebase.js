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
let recaptchaReadyPromise = null;
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

// ─── reCAPTCHA Management (Singleton with render lock) ───────────
// Key fixes:
//   1. recaptchaReadyPromise acts as a lock — concurrent calls to
//      getRecaptchaVerifier() await the same creation+render promise,
//      preventing duplicate verifiers ("already rendered" error).
//   2. The verifier is explicitly .render()ed and awaited before use.
//      Without rendering, signInWithPhoneNumber fails with
//      auth/configuration-not-found and no reCAPTCHA tokens are generated.
//   3. clearRecaptchaVerifier() destroys the verifier AND resets the lock.

/**
 * Returns the singleton RecaptchaVerifier, creating + rendering it if
 * needed. Concurrent calls share the same creation promise (lock),
 * so the widget is never rendered twice in the same container.
 */
export async function getRecaptchaVerifier(containerId = "recaptcha-container") {
  await getAuthInstance();

  // If creation+render is in flight, await it (prevents race condition)
  if (recaptchaReadyPromise) {
    await recaptchaReadyPromise;
  }

  // Reuse the existing, already-rendered verifier
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  // Create + render in a single locked promise
  recaptchaReadyPromise = (async () => {
    // Clear any leftover DOM in the container before creating
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = "";

    const verifier = new window.firebase.auth.RecaptchaVerifier(containerId, {
      size: "invisible",
      callback: (token) => {
        console.log("[Firebase] reCAPTCHA token generated:", token ? "✓" : "✗");
      },
      "expired-callback": () => {
        console.warn("[Firebase] reCAPTCHA expired — clearing verifier");
        clearRecaptchaVerifier();
      },
      "error-callback": (err) => {
        console.error("[Firebase] reCAPTCHA error callback:", err);
        clearRecaptchaVerifier();
      },
    });

    // Explicitly render the widget and await readiness.
    // This is critical — without it, signInWithPhoneNumber fails with
    // auth/configuration-not-found and no tokens are generated.
    await verifier.render();
    console.log("[Firebase] reCAPTCHA verifier rendered successfully");
    return verifier;
  })();

  try {
    recaptchaVerifier = await recaptchaReadyPromise;
    return recaptchaVerifier;
  } catch (err) {
    console.error("[Firebase] reCAPTCHA setup failed:", err);
    recaptchaVerifier = null;
    throw new Error(
      "Could not initialize reCAPTCHA. Please refresh the page and try again."
    );
  } finally {
    recaptchaReadyPromise = null;
  }
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
      console.warn("[Firebase] Error clearing reCAPTCHA verifier:", e);
    }
    recaptchaVerifier = null;
  }
  recaptchaReadyPromise = null;
}

/**
 * Sends an SMS verification code to the given phone number.
 * Reuses the singleton RecaptchaVerifier — does NOT create a new one
 * on repeated calls. The verifier is already rendered, so
 * signInWithPhoneNumber can trigger reCAPTCHA execution immediately.
 */
export async function sendPhoneCode(phone, containerId = "recaptcha-container") {
  const auth = await getAuthInstance();
  const verifier = await getRecaptchaVerifier(containerId);
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