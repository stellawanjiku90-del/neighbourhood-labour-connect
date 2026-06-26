import { base44 } from "@/api/base44Client";

// ─── Firebase Web Config ──────────────────────────────────────────
// Config is fetched at runtime from the getFirebaseConfig backend
// function, which reads from app secrets:
//   FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
//   FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
//
// Ensure these are set in Dashboard → Settings → Environment Variables
// and that Phone sign-in is enabled in the Firebase Console
// (Authentication → Sign-in method → Phone).
//
// You must also add this app's domain to Firebase Authorized Domains
// (Authentication → Settings → Authorized domains).
//
// NOTE: FIREBASE_APP_ID must be a **Web** app ID (1:xxx:web:xxx),
// not an Android/iOS app ID, for the Web SDK to work.
//
// The Firebase SDK is loaded via CDN compat scripts in index.html
// (window.firebase) to avoid Vite dep-optimization issues.

let firebaseApp = null;
let authInstance = null;
let configReady = false;
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
 * Initializes the Firebase app + auth (once) and returns the Auth instance.
 * Throws if configuration is missing or the SDK hasn't loaded.
 */
export async function getFirebaseAuth() {
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
    authInstance = firebaseApp.auth();
    configReady = true;
    return authInstance;
  })();
  return initPromise;
}

/** Returns true once Firebase has been successfully initialized. */
export function isConfigReady() {
  return configReady;
}

/** Subscribes to Firebase auth state changes. Returns an unsubscribe function. */
export async function subscribeAuthState(callback) {
  const auth = await getFirebaseAuth();
  return auth.onAuthStateChanged(callback);
}

/** Creates a RecaptchaVerifier bound to the given container element ID. */
export async function createRecaptchaVerifier(container, params) {
  await getFirebaseAuth();
  return new window.firebase.auth.RecaptchaVerifier(container, params);
}

/** Sends an SMS verification code to the given phone number. */
export async function sendPhoneCode(phone, verifier) {
  const auth = await getFirebaseAuth();
  return auth.signInWithPhoneNumber(phone, verifier);
}

/** Signs out the current Firebase user. */
export async function signOutFirebase() {
  const auth = await getFirebaseAuth();
  await auth.signOut();
}