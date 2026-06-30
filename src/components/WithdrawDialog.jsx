import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Check, Wallet } from "lucide-react";

const PROVIDERS = [
  { value: "M-PESA", label: "M-Pesa" },
  { value: "AIRTEL", label: "Airtel Money" },
];

export default function WithdrawDialog({ open, onOpenChange, availableBalance }) {
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState("M-PESA");
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const submit = async () => {
    const cleaned = phone.replace(/[^\d]/g, "");
    if (cleaned.length < 9) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await base44.functions.invoke("requestPayout", {
        provider,
        phone: "+" + cleaned,
      });
      setResult(data);
      setStep("done");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setPhone("");
    setProvider("M-PESA");
    setError(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Available: <strong>${(availableBalance || 0).toFixed(2)}</strong> (sent as KES at ~130/USD)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">Phone number</p>
                <Input
                  placeholder="712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl"
                  inputMode="numeric"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">Mobile money provider</p>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button onClick={submit} disabled={loading || !phone} className="w-full rounded-xl h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {loading ? "Processing…" : "Withdraw now"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Funds are sent automatically to your mobile money number and arrive within seconds.
              </p>
            </div>
          </>
        )}
        {step === "done" && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                {result.success ? "Withdrawal submitted" : "Withdrawal failed"}
              </DialogTitle>
              <DialogDescription>
                {result.success
                  ? `KES ${(result.amount_kes || 0).toLocaleString()} has been sent to ${result.phone}. Check your phone for the M-Pesa message.`
                  : "The payout request did not go through. Please try again."}
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => onOpenChange(false)} className="w-full rounded-xl h-11 mt-2">
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}