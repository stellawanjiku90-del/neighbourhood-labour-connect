import { useState, useEffect, useRef } from "react";
import { CreditCard, Check, Loader2, X, Smartphone } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

export default function Subscribe() {
  const { active, periodEnd, loading } = useSubscription();
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [sdkReady, setSdkReady] = useState(
    typeof window !== "undefined" && !!window.IntaSend
  );
  const [paymentState, setPaymentState] = useState("idle"); // idle | success | failed
  const [error, setError] = useState(null);
  const [buttonEl, setButtonEl] = useState(null);
  const initedRef = useRef(false);
  const pollRef = useRef(null);

  // ─── Fetch the public IntaSend config (publishable key + live flag) ──
  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke("getIntaSendConfig", {})
      .then((res) => {
        if (!cancelled) setConfig(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Wait for the IntaSend checkout SDK script to load ──────────────
  useEffect(() => {
    if (window.IntaSend) {
      setSdkReady(true);
      return;
    }
    const t = setInterval(() => {
      if (window.IntaSend) {
        setSdkReady(true);
        clearInterval(t);
      }
    }, 300);
    return () => clearInterval(t);
  }, []);

  // ─── Initialize the IntaSend SDK once the pay button is in the DOM ──
  // The SDK scans for `.intaSendPayButton` at construction time, so it must
  // run AFTER the button is committed to the DOM. Runs entirely in the
  // browser, so requests originate from the user's IP (not the server's),
  // avoiding the Cloudflare 1106 IP block on the backend path.
  useEffect(() => {
    if (!buttonEl) {
      initedRef.current = false; // allow re-init if the button remounts
      return;
    }
    if (!sdkReady || !config || initedRef.current) return;
    initedRef.current = true;
    new window.IntaSend({
      publicAPIKey: config.publishable_key,
      live: config.live,
    })
      .on("COMPLETE", () => setPaymentState("success"))
      .on("FAILED", () => {
        setError("Payment was not completed. Please try again.");
        setPaymentState("failed");
      });
  }, [sdkReady, config, buttonEl]);

  // ─── On success, poll the DB until the webhook activates the sub ────
  useEffect(() => {
    if (paymentState !== "success") return;
    let attempts = 0;
    const maxAttempts = 30; // ~60s
    const poll = async () => {
      attempts++;
      try {
        const res = await base44.functions.invoke("checkSubscription", {
          firebase_uid: user?.id,
        });
        if (res.data?.active) {
          window.location.href = "/";
          return;
        }
      } catch {
        // ignore — keep polling
      }
      if (attempts >= maxAttempts) {
        // Webhook may still be processing — head home; it activates shortly.
        window.location.href = "/";
        return;
      }
      pollRef.current = setTimeout(poll, 2000);
    };
    pollRef.current = setTimeout(poll, 2000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [paymentState]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Active or just paid ───────────────────────────────────────────
  if (active || paymentState === "success") {
    return (
      <div className="h-full overflow-y-auto max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C9E8D8] flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-[#2D7A3E]" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-1">
            {paymentState === "success" ? "Payment Successful!" : "Subscription Active"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {paymentState === "success"
              ? "Confirming your subscription…"
              : `Your subscription is active until ${new Date(periodEnd).toLocaleDateString()}.`}
          </p>
          {paymentState === "success" && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Activating…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Idle or failed: offer card with the pay button ─────────────────
  // The button is kept mounted across idle/failed transitions so the SDK's
  // click handler survives (swapping the tree would unmount it).
  const phone = (user?.phone || "").replace("+", "");
  const nameParts = (user?.full_name || "Customer").split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "Customer";

  return (
    <div className="h-full overflow-y-auto max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <CreditCard className="w-7 h-7 text-secondary-foreground" />
        </div>
        <h1 className="text-xl font-extrabold text-foreground mb-2">
          Monthly Subscription
        </h1>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-extrabold text-foreground">Ksh 130</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-[#2D7A3E]" /> View service provider
            profiles
          </li>
          <li className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-[#2D7A3E]" /> Chat with providers and
            customers
          </li>
          <li className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-[#2D7A3E]" /> Unlock phone number
            sharing
          </li>
        </ul>
        {paymentState === "failed" && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 flex items-center gap-2 text-sm text-destructive">
            <X className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <button
          ref={setButtonEl}
          className="intaSendPayButton w-full h-12 rounded-xl bg-[#2D7A3E] hover:bg-[#246332] text-white font-semibold flex items-center justify-center gap-2"
          data-amount="130"
          data-currency="KES"
          data-method="M-PESA"
          data-phone-number={phone}
          data-api-ref={`NLC|${user?.id || ""}`}
          data-first-name={firstName}
          data-last-name={lastName}
          data-email={`${phone}@ncl.app`}
          data-country="KE"
          data-mobile-tarrif="BUSINESS-PAYS"
        >
          <Smartphone className="w-5 h-5" /> Pay Ksh 130 via M-Pesa
        </button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          You'll receive an M-Pesa prompt on your phone to enter your PIN.
        </p>
      </div>
    </div>
  );
}