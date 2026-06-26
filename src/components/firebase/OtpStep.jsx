import { useState } from "react";
import { Shield, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function OtpStep({ phone, onVerify, onResend, onBack, loading, error, resendTimer }) {
  const [code, setCode] = useState("");

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5">
        <Shield className="w-7 h-7 text-secondary-foreground" />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Enter Verification Code</h1>
      <p className="text-muted-foreground text-sm mb-6">
        We sent a 6-digit code to{" "}
        <span className="font-semibold text-foreground">{phone}</span>
      </p>
      <div className="flex justify-center mb-6">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6 && !loading) onVerify(v);
          }}
          disabled={loading}
          autoFocus
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-10 h-12 text-lg" />
            <InputOTPSlot index={1} className="w-10 h-12 text-lg" />
            <InputOTPSlot index={2} className="w-10 h-12 text-lg" />
            <InputOTPSlot index={3} className="w-10 h-12 text-lg" />
            <InputOTPSlot index={4} className="w-10 h-12 text-lg" />
            <InputOTPSlot index={5} className="w-10 h-12 text-lg" />
          </InputOTPGroup>
        </InputOTP>
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <Button
        onClick={() => onVerify(code)}
        disabled={loading || code.length !== 6}
        className="w-full h-12 rounded-xl bg-[#2D7A3E] hover:bg-[#246332]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…
          </>
        ) : (
          "Verify & Continue"
        )}
      </Button>
      <div className="text-center mt-4">
        {resendTimer > 0 ? (
          <p className="text-sm text-muted-foreground">Resend code in {resendTimer}s</p>
        ) : (
          <button
            onClick={onResend}
            disabled={loading}
            className="text-sm text-[#2D7A3E] hover:underline font-medium"
          >
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}