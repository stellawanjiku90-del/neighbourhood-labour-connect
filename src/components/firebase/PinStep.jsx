import { useState } from "react";
import { Lock, Loader2, AlertCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function PinStep({ mode, onConfirm, onForgotPin, loading, error }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [stage, setStage] = useState(1); // 1 = enter, 2 = confirm (setup only)
  const [localError, setLocalError] = useState(null);

  const isSetup = mode === "setup";
  const displayError = error || localError;

  const handleConfirm = () => {
    setLocalError(null);
    if (isSetup && stage === 1) {
      if (pin.length !== 4) {
        setLocalError("Please enter a 4-digit PIN.");
        return;
      }
      setStage(2);
      return;
    }
    if (isSetup && stage === 2) {
      if (pin !== confirmPin) {
        setLocalError("PINs don't match. Please try again.");
        setConfirmPin("");
        return;
      }
      onConfirm(pin);
      return;
    }
    // Login mode
    if (pin.length !== 4) {
      setLocalError("Please enter your 4-digit PIN.");
      return;
    }
    onConfirm(pin);
  };

  const handleBack = () => {
    setStage(1);
    setConfirmPin("");
    setLocalError(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5">
        {isSetup ? (
          <KeyRound className="w-7 h-7 text-secondary-foreground" />
        ) : (
          <Lock className="w-7 h-7 text-secondary-foreground" />
        )}
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        {isSetup
          ? stage === 1
            ? "Set Your 4-Digit PIN"
            : "Confirm Your PIN"
          : "Enter Your PIN"}
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        {isSetup
          ? stage === 1
            ? "This PIN will be used to log in quickly next time."
            : "Re-enter your PIN to confirm."
          : "Enter your 4-digit PIN to access your account."}
      </p>
      <div className="flex justify-center mb-6">
        <InputOTP
          maxLength={4}
          value={stage === 2 ? confirmPin : pin}
          onChange={(v) => (stage === 2 ? setConfirmPin(v) : setPin(v))}
          disabled={loading}
          autoFocus
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
          </InputOTPGroup>
        </InputOTP>
      </div>
      {displayError && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{displayError}</span>
        </div>
      )}
      <Button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[#2D7A3E] hover:bg-[#246332]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
            {isSetup ? "Saving…" : "Verifying…"}
          </>
        ) : (
          isSetup ? (stage === 1 ? "Continue" : "Confirm PIN") : "Log In"
        )}
      </Button>
      {isSetup && stage === 2 && (
        <button
          onClick={handleBack}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3"
        >
          Back
        </button>
      )}
      {!isSetup && onForgotPin && (
        <button
          onClick={onForgotPin}
          disabled={loading}
          className="w-full text-center text-sm text-[#2D7A3E] hover:underline font-medium mt-3"
        >
          Forgot PIN?
        </button>
      )}
    </div>
  );
}