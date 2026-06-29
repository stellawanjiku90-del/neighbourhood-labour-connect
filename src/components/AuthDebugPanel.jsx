import { useState } from "react";

// Temporary diagnostic panel for the auth/captcha-check-failed investigation.
// Hidden by default; shown when ?debug=1 is in the URL or localStorage
// "nlc_debug" === "1", so it can be toggled inside the Android WebView
// (which runs the production build) without a dev server.
function isDebugMode() {
  try {
    if (typeof window === "undefined") return false;
    if (new URLSearchParams(window.location.search).has("debug")) return true;
    if (window.localStorage?.getItem("nlc_debug") === "1") return true;
  } catch (e) {
    // ignore
  }
  return false;
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, Object.getOwnPropertyNames(obj || {}), 2);
  } catch (e) {
    return String(obj);
  }
}

export default function AuthDebugPanel({ error }) {
  const [show] = useState(isDebugMode);
  if (!show) return null;

  const locRows = [
    ["href", typeof window !== "undefined" ? window.location.href : ""],
    ["origin", typeof window !== "undefined" ? window.location.origin : ""],
    ["hostname", typeof window !== "undefined" ? window.location.hostname : ""],
    ["userAgent", typeof navigator !== "undefined" ? navigator.userAgent : ""],
  ];

  return (
    <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-[11px] font-mono text-amber-900 break-all dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="font-bold mb-1">DEBUG · WebView origin</p>
      {locRows.map(([k, v]) => (
        <p key={k} className="leading-tight">
          <span className="font-semibold">{k}:</span> {v || "(empty)"}
        </p>
      ))}

      <p className="font-bold mt-2 mb-1">DEBUG · Last Firebase error</p>
      {error ? (
        <div className="space-y-1">
          <p className="leading-tight">
            <span className="font-semibold">code:</span> {error.code || "(none)"}
          </p>
          <p className="leading-tight">
            <span className="font-semibold">message:</span> {error.message || "(none)"}
          </p>
          <pre className="whitespace-pre-wrap text-[10px] leading-tight mt-1">
{safeStringify(error)}
          </pre>
        </div>
      ) : (
        <p className="leading-tight">(no error yet)</p>
      )}
    </div>
  );
}