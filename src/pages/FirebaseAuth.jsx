import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirebaseAuth,
  createRecaptchaVerifier,
  sendPhoneCode,
} from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Shield, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const LOGO_URL =
  "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function FirebaseAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState("phone"); // "phone" | "code"
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const recaptchaRef = useRef(null); // guards against re-instantiation
  const confirmationRef = useRef(null);

  // Create the invisible reCAPTCHA once on mount
  useEffect(() => {
    let active = true;
    getFirebaseAuth()
      .then(() => {
        if (!active || recaptchaRef.current) return;
        return createRecaptchaVerifier("recaptcha-container", {
          size: "invisible",
        }).then((verifier) => {
          if (!active) return;
          recaptchaRef.current = verifier;
          verifier.render();
        });
      })
      .catch((err) => setError("Unable to initialize Firebase: " + err.message));

    return () => {
      active = false;
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const normalizePhone = (raw) => {
    let cleaned = raw.replace(/[^\d+]/g, "");
    if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
    return cleaned;
  };

  const handleAuthError = (err) => {
    const map = {
      "auth/invalid-phone-number":
        "Please enter a valid phone number with country code (e.g. +254712345678).",
      "auth/missing-phone-number": "Please enter a phone number.",
      "auth/code-expired": "The verification code has expired. Please request a new one.",
      "auth/invalid-verification-code": "Incorrect code. Please check and try again.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/quota-exceeded": "SMS quota exceeded. Use a test number or try again later.",
      "auth/captcha-check-failed": "reCAPTCHA verification failed. Please refresh and try again.",
      "auth/operation-not-allowed":
        "Phone sign-in is not enabled. Enable it in the Firebase Console.",
    };
    setError(map[err.code] || err.message || "Something went wrong. Please try again.");
  };

  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  };

  const ensureRecaptcha = async () => {
    if (recaptchaRef.current) return recaptchaRef.current;
    const verifier = await createRecaptchaVerifier("recaptcha-container", {
      size: "invisible",
    });
    recaptchaRef.current = verifier;
    await verifier.render();
    return verifier;
  };

  const sendCode = async () => {
    setError(null);
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) {
      setError("Please enter a valid phone number with country code.");
      return;
    }
    setLoading(true);
    try {
      await getFirebaseAuth();
      const verifier = await ensureRecaptcha();
      const confirmation = await sendPhoneCode(normalized, verifier);
      confirmationRef.current = confirmation;
      setPhone(normalized);
      setStep("code");
      setResendTimer(60);
    } catch (err) {
      handleAuthError(err);
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      await confirmationRef.current.confirm(code);
      // onAuthStateChanged fires → route guard redirects to /firebase-app
      navigate("/firebase-app");
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      await getFirebaseAuth();
      resetRecaptcha();
      const verifier = await ensureRecaptcha();
      const confirmation = await sendPhoneCode(phone, verifier);
      confirmationRef.current = confirmation;
      setResendTimer(60);
    } catch (err) {
      handleAuthError(err);
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-6 h-20 shrink-0">
        <img
          src={LOGO_URL}
          alt="Neighbourhood Labour Connect"
          className="w-9 h-9 rounded-full object-cover"
        />
        <span className="font-extrabold text-foreground">Neighbourhood Labour Connect</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {step === "phone" && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5">
                <Phone className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">Phone Verification</h1>
              <p className="text-muted-foreground text-sm mb-6">
                Enter your phone number and we'll send you a verification code via SMS.
              </p>
              <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678"
                className="h-12 rounded-xl text-base mb-4"
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && !loading && sendCode()}
              />
              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <Button
                onClick={sendCode}
                disabled={loading || !phone}
                className="w-full h-12 rounded-xl bg-[#2D7A3E] hover:bg-[#246332]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending code…
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </div>
          )}

          {step === "code" && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
              <button
                onClick={() => {
                  setStep("phone");
                  setError(null);
                  setCode("");
                }}
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
              <Input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="h-14 rounded-xl text-center text-2xl tracking-[0.5em] font-bold mb-4"
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && !loading && verifyCode()}
                autoFocus
              />
              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <Button
                onClick={verifyCode}
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
                    onClick={resendCode}
                    disabled={loading}
                    className="text-sm text-[#2D7A3E] hover:underline font-medium"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* reCAPTCHA container (invisible badge) */}
      <div id="recaptcha-container" />

      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Neighbourhood Labour Connect
        </p>
      </footer>
    </div>
  );
}