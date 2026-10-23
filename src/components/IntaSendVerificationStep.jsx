import { useEffect, useState } from "react";
import { Loader2, Smartphone, CheckCircle2, RefreshCw } from "lucide-react";

export default function IntaSendVerificationStep({ phone, verificationId, amountKes = 100, onVerified, onRetry, loading = false }) {
  const [status, setStatus] = useState("PENDING");
  const [message, setMessage] = useState("Waiting for the M-Pesa prompt…");

  useEffect(() => {
    let active = true;
    let timer;
    const poll = async () => {
      try {
        const res = await fetch(`/api/auth/verification/status?verification_id=${encodeURIComponent(verificationId)}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.error || "Unable to check verification.");
        setStatus(data.status);
        if (data.verified && data.verification_token) {
          setMessage("Payment received. Your phone is verified.");
          onVerified(data.verification_token);
          return;
        }
        if (["FAILED", "EXPIRED"].includes(data.status)) {
          setMessage(data.status === "EXPIRED" ? "The verification payment expired. Please try again." : "The verification payment was not completed.");
          return;
        }
        setMessage("Complete the M-Pesa prompt on your phone. We will verify the payment automatically.");
        timer = setTimeout(poll, 3000);
      } catch (e) {
        if (!active) return;
        setMessage(e.message || "Unable to check payment status.");
        timer = setTimeout(poll, 5000);
      }
    };
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [verificationId, onVerified]);

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        {status === "SUCCESS" ? <CheckCircle2 className="h-8 w-8" /> : <Smartphone className="h-8 w-8" />}
      </div>
      <div>
        <h2 className="text-xl font-semibold">Verify your phone</h2>
        <p className="mt-2 text-sm text-muted-foreground">An M-Pesa prompt for <strong>KSh {amountKes}</strong> has been sent to <strong>{phone}</strong>.</p>
      </div>
      <div className="rounded-xl border bg-muted/30 p-4 text-sm">{message}</div>
      {status === "PENDING" && <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking payment…</div>}
      {["FAILED", "EXPIRED"].includes(status) && <button type="button" onClick={onRetry} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"><RefreshCw className="h-4 w-4" />Try again</button>}
      <p className="text-xs text-muted-foreground">Complete the payment to verify your number and continue.</p>
    </div>
  );
}
