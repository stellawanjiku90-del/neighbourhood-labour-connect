import { useState, useEffect, useRef } from "react";
import { Check, Loader2, X, Smartphone, ShieldCheck, Eye, Search, Briefcase, Star, CreditCard, ArrowLeft, MessageCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";

export default function Subscribe() {
  const navigate = useNavigate();
  const { active, periodEnd, loading } = useSubscription();
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [sdkReady, setSdkReady] = useState(
    typeof window !== "undefined" && !!window.IntaSend
  );
  const [paymentState, setPaymentState] = useState("idle");
  const [error, setError] = useState(null);
  const [buttonEl, setButtonEl] = useState(null);
  const initedRef = useRef(false);
  const pollRef = useRef(null);
  const invoiceIdRef = useRef(null);

  // ─── Fetch the public IntaSend config ──
  useEffect(() => {
    let cancelled = false;
    apiClient.functions
      .invoke("getIntaSendConfig", {})
      .then((res) => {
        if (!cancelled) setConfig(res.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ─── Wait for the IntaSend checkout SDK script to load ──────────────
  useEffect(() => {
    if (window.IntaSend) { setSdkReady(true); return; }
    const t = setInterval(() => {
      if (window.IntaSend) { setSdkReady(true); clearInterval(t); }
    }, 300);
    return () => clearInterval(t);
  }, []);

  // ─── Apply safe-area padding to IntaSend modal when it appears ──────
  useEffect(() => {
    const applySafeArea = () => {
      const modals = document.querySelectorAll('.intaSendModal, [class*="intaSend"], div[style*="position: fixed"]');
      modals.forEach((modal) => {
        modal.style.paddingTop = 'calc(20px + env(safe-area-inset-top, 0px))';
        modal.style.paddingBottom = 'calc(20px + env(safe-area-inset-bottom, 0px))';
        modal.style.paddingLeft = 'calc(16px + env(safe-area-inset-left, 0px))';
        modal.style.paddingRight = 'calc(16px + env(safe-area-inset-right, 0px))';
        modal.style.maxHeight = 'calc(100vh - env(safe-area-inset-top, 20px) - env(safe-area-inset-bottom, 20px))';
        modal.style.overflowY = 'auto';
        const closeBtn = modal.querySelector('button[aria-label="Close"], button[class*="close"]');
        if (closeBtn) {
          closeBtn.style.marginTop = 'env(safe-area-inset-top, 0px)';
          closeBtn.style.zIndex = '9999';
        }
      });
    };
    
    const observer = new MutationObserver(applySafeArea);
    observer.observe(document.body, { childList: true, subtree: true });
    applySafeArea();
    return () => observer.disconnect();
  }, []);

  // ─── Initialize the IntaSend SDK once the pay button is in the DOM ──
  useEffect(() => {
    if (!buttonEl) { initedRef.current = false; return; }
    if (!sdkReady || !config || initedRef.current) return;
    initedRef.current = true;
    new window.IntaSend({
      publicAPIKey: config.publishable_key,
      live: config.live,
    })
      .on("COMPLETE", (results) => {
        // Capture the invoice id so we can actively verify + activate the
        // payment ourselves, without depending on the IntaSend webhook.
        invoiceIdRef.current =
          results?.invoice?.invoice_id ||
          results?.invoice_id ||
          results?.id ||
          results?.tracking_id ||
          null;
        setPaymentState("success");
      })
      .on("FAILED", () => { setError("Payment was not completed. Please try again."); setPaymentState("failed"); });
  }, [sdkReady, config, buttonEl]);

  // ─── On success, poll the DB until the webhook activates the sub ────
  useEffect(() => {
    if (paymentState !== "success") return;
    let attempts = 0;
    const finishActivation = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("intent") === "provider" && user?.id) {
        try {
          const providers = await apiClient.entities.ServiceProvider.filter({ firebase_uid: user.id }, null, 1);
          if (providers.length > 0) await apiClient.entities.ServiceProvider.update(providers[0].id, { available: true });
          sessionStorage.setItem("provider_just_listed", "true");
        } catch { /* best-effort */ }
      }
      window.location.href = "/";
    };
    const poll = async () => {
      attempts++;
      try {
        // Active verification — queries IntaSend directly and activates the
        // subscription as soon as the payment is confirmed (no webhook needed).
        if (invoiceIdRef.current) {
          const res = await apiClient.functions.invoke("checkMpesaPayment", {
            invoice_id: invoiceIdRef.current,
            firebase_uid: user?.id,
          });
          const st = res.data?.state;
          if (st === "SUCCESS" || st === "COMPLETED" || res.data?.activated || res.data?.already_active) {
            await finishActivation();
            return;
          }
        }
        // Fallback — the webhook may have already activated it.
        const subRes = await apiClient.functions.invoke("checkSubscription", { firebase_uid: user?.id });
        if (subRes.data?.active) {
          await finishActivation();
          return;
        }
      } catch { /* ignore */ }
      if (attempts >= 30) { window.location.href = "/"; return; }
      pollRef.current = setTimeout(poll, 2000);
    };
    pollRef.current = setTimeout(poll, 2000);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [paymentState]);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <header className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border bg-background" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">Subscribe</h1>
            <p className="text-[11px] text-muted-foreground">Loading…</p>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto page-content py-5" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (active || paymentState === "success") {
    return (
      <div className="h-full flex flex-col">
        <header className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border bg-background" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">Subscribe</h1>
            <p className="text-[11px] text-muted-foreground">Payment confirmation</p>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto page-content py-5" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}>
          <div className="flex items-center justify-center py-20">
            <div className="bg-card rounded-3xl border border-border p-6 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#C9E8D8] flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-xl font-extrabold text-foreground mb-1">
                {paymentState === "success" ? "Payment Successful!" : "Subscription Active"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {paymentState === "success"
                  ? "Confirming your subscription…"
                  : `Your subscription runs until ${new Date(periodEnd).toLocaleDateString()}.`}
              </p>
              {paymentState === "success" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Activating…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isProvider = user?.role === "provider";
  const phone = (user?.phone || "").replace("+", "");
  const nameParts = (user?.full_name || "Customer").split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "Customer";

  const PROVIDER_BENEFITS = [
    { icon: Search, label: "Receive job notifications", desc: "Get alerted when new jobs match your skills" },
    { icon: Eye, label: "Appear in search results", desc: "Customers find you when looking for help" },
    { icon: ShieldCheck, label: "Verified provider badge", desc: "Build trust with verified status" },
    { icon: Briefcase, label: "Unlimited applications", desc: "Apply to as many jobs as you like" },
    { icon: Star, label: "Priority visibility", desc: "Featured higher in search rankings" },
  ];

  const CUSTOMER_BENEFITS = [
    { icon: Briefcase, label: "Post unlimited jobs", desc: "Request help for any task, anytime" },
    { icon: Search, label: "Browse all providers", desc: "Access the full directory of local pros" },
    { icon: MessageCircle, label: "Direct messaging", desc: "Chat with providers and share phone numbers" },
    { icon: ShieldCheck, label: "Verified pros only", desc: "Work with reviewed, rated professionals" },
    { icon: Star, label: "Priority support", desc: "Get faster responses to your job posts" },
  ];

  const BENEFITS = isProvider ? PROVIDER_BENEFITS : CUSTOMER_BENEFITS;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border bg-background" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground">Subscribe</h1>
          <p className="text-[11px] text-muted-foreground">1 USD / month</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto page-content py-5" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}>
        <div className="bg-card rounded-3xl border border-border p-5 w-full max-w-md mx-auto md:mx-0">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-foreground">
            {isProvider ? "Provider plan" : "Customer plan"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isProvider
              ? "Unlock your provider dashboard and start earning"
              : "Unlock job posting and connect with local professionals"}
          </p>
        </div>
        {/* Benefits */}
        <div className="space-y-1.5 mb-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.label} className="flex items-start gap-3 bg-secondary/50 rounded-xl p-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{b.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment */}
        <div className="bg-muted rounded-2xl p-3 mb-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Secure payment
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Your subscription is activated automatically once the payment is confirmed.
          </p>
        </div>

        {paymentState === "failed" && (
          <div className="mb-3 p-2.5 rounded-lg bg-destructive/10 flex items-center gap-2 text-xs text-destructive">
            <X className="w-4 h-4 shrink-0" />
            <span>{error || "Payment failed. Try again."}</span>
          </div>
        )}

        <button
          ref={setButtonEl}
          className="intaSendPayButton w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2"
          data-amount="130"
          data-currency="KES"
          data-phone-number={phone}
          data-api-ref={`NLC|${user?.id || ""}`}
          data-first-name={firstName}
          data-last-name={lastName}
          data-email={`${phone}@ncl.app`}
          data-country="KE"
          data-mobile-tarrif="BUSINESS-PAYS"
        >
          <Smartphone className="w-5 h-5" /> Pay $1
        </button>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Choose your preferred payment method and follow the prompts to confirm your payment.
        </p>
        </div>
      </div>
    </div>
  );
}