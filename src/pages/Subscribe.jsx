import { useState, useEffect, useRef } from "react";
import { CreditCard, Check, Loader2, X, Smartphone } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

export default function Subscribe() {
  const { active, periodEnd, loading } = useSubscription();
  const { user } = useAuth();
  const [paymentState, setPaymentState] = useState("idle"); // idle | pending | success | failed
  const [invoiceId, setInvoiceId] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [phone, setPhone] = useState("");
  const pollRef = useRef(null);

  const startPayment = async () => {
    setError(null);
    setErrorDetails(null);
    setPaymentState("pending");
    try {
      const res = await base44.functions.invoke("createMpesaPayment", {
        firebase_uid: user?.id,
      });
      setInvoiceId(res.data.invoice_id);
      setPhone(res.data.phone);
    } catch (err) {
      const intasendError = err.response?.data?.intasend_error;
      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to initiate payment. Please try again."
      );
      if (intasendError) {
        setErrorDetails(intasendError);
        console.error("[IntaSend] Payment initiation failed:", intasendError);
      }
      setPaymentState("failed");
    }
  };

  // Poll for payment status while pending
  useEffect(() => {
    if (paymentState !== "pending" || !invoiceId) return;
    let attempts = 0;
    const maxAttempts = 40; // ~2 minutes at 3s intervals

    const poll = async () => {
      attempts++;
      try {
        const res = await base44.functions.invoke("checkMpesaPayment", {
          invoice_id: invoiceId,
          firebase_uid: user?.id,
        });
        const state = res.data.state;

        if (state === "SUCCESS" || state === "COMPLETED") {
          setPaymentState("success");
          setTimeout(() => {
            window.location.href = "/";
          }, 2500);
          return;
        }
        if (state === "FAILED" || state === "CANCELLED") {
          setError(res.data.reason || "Payment was not completed.");
          setPaymentState("failed");
          return;
        }
        if (attempts >= maxAttempts) {
          setError(
            "Payment confirmation timed out. If you completed the payment, your subscription will be activated shortly."
          );
          setPaymentState("failed");
          return;
        }
        pollRef.current = setTimeout(poll, 3000);
      } catch (err) {
        if (attempts >= maxAttempts) {
          setError("Payment confirmation timed out. Please try again.");
          setPaymentState("failed");
          return;
        }
        pollRef.current = setTimeout(poll, 3000);
      }
    };

    pollRef.current = setTimeout(poll, 3000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [paymentState, invoiceId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Active or just paid ───────────────────────────────────────
  if (active || paymentState === "success") {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C9E8D8] flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-[#2D7A3E]" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-1">
            {paymentState === "success" ? "Payment Successful!" : "Subscription Active"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {paymentState === "success"
              ? "Your subscription is now active. Redirecting…"
              : `Your subscription is active until ${new Date(periodEnd).toLocaleDateString()}.`}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You can view profiles and chat freely.
          </p>
        </div>
      </div>
    );
  }

  // ─── Waiting for M-Pesa PIN ────────────────────────────────────
  if (paymentState === "pending") {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/60 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-7 h-7 text-accent-foreground animate-pulse" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-1">
            Check Your Phone
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            We've sent an M-Pesa payment prompt to{" "}
            <span className="font-semibold text-foreground">{phone}</span>. Enter
            your M-Pesa PIN to complete the payment of Ksh 130.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for confirmation…
          </div>
        </div>
      </div>
    );
  }

  // ─── Payment failed ─────────────────────────────────────────────
  if (paymentState === "failed") {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-1">
            Payment Not Completed
          </h1>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          {errorDetails && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-left space-y-1">
              <p className="text-xs font-semibold text-foreground">
                IntaSend Diagnostics
              </p>
              <p className="text-xs text-muted-foreground">
                Environment: <span className="font-medium text-foreground">{errorDetails.environment || "unknown"}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                HTTP Status: <span className="font-medium text-foreground">{errorDetails.http_status}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Endpoint: <span className="font-mono text-foreground break-all">{errorDetails.endpoint}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Raw Response: <span className="font-mono text-foreground break-all">{errorDetails.raw_body}</span>
              </p>
            </div>
          )}
          <button
            onClick={startPayment}
            className="w-full h-12 rounded-xl bg-[#2D7A3E] hover:bg-[#246332] text-white font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Idle: show subscription offer ─────────────────────────────
  return (
    <div className="max-w-md mx-auto px-4 py-8">
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
        <button
          onClick={startPayment}
          className="w-full h-12 rounded-xl bg-[#2D7A3E] hover:bg-[#246332] text-white font-semibold flex items-center justify-center gap-2"
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