import { useState } from "react";

// Temporary diagnostic panel for identifying the WebView origin during
// Firebase Phone Auth (auth/captcha-check-failed investigation).
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

export default function AuthDebugPanel() {
  const [show] = useState(isDebugMode);
  if (!show) return null;

  const rows = [
    ["href", typeof window !== "undefined" ? window.location.href : ""],
    ["origin", typeof window !== "undefined" ? window.location.origin : ""],
    ["hostname", typeof window !== "undefined" ? window.location.hostname : ""],
    ["userAgent", typeof navigator !== "undefined" ? navigator.userAgent : ""],
  ];

  return (
    <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-[11px] font-mono text-amber-900 break-all dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="font-bold mb-1">DEBUG · WebView origin</p>
      {rows.map(([k, v]) => (
        <p key={k} className="leading-tight">
          <span className="font-semibold">{k}:</span> {v || "(empty)"}
        </p>
      ))}
    </div>
  );
}