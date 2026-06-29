import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  sendPhoneCode,
  getAuthInstance,
  signOutFirebase,
} from "@/lib/firebase";
import { hashPin } from "@/lib/pin";
import { useAuth } from "@/lib/AuthContext";
import PhoneStep from "@/components/firebase/PhoneStep";
import OtpStep from "@/components/firebase/OtpStep";
import PinStep from "@/components/firebase/PinStep";
import ProfileSetupStep from "@/components/firebase/ProfileSetupStep";
import RoleStep from "@/components/firebase/RoleStep";
import AuthDebugPanel from "@/components/AuthDebugPanel";
import SafeAreaPage from "@/components/SafeAreaPage";
import { ShieldCheck, HelpCircle } from "lucide-react";

const LOGO_URL =
  "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function FirebaseAuth() {
  const navigate = useNavigate();
  const { setPinSession } = useAuth();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  // Raw Firebase error for the debug panel (code + full object).
  const [debugError, setDebugError] = useState(null);

  // On mount: if an active PIN session exists, go home — unless the profile
  // is incomplete, in which case resume at the profile step so the user can
  // finish registration. Otherwise clear any stale Firebase session so the
  // phone-first flow starts from a clean state.
  useEffect(() => {
    let active = true;
    (async () => {
      if (sessionStorage.getItem("pin_verified") === "true") {
        const stored = sessionStorage.getItem("pin_session_profile");
        if (stored) {
          try {
            const profile = JSON.parse(stored);
            if (profile.profile_completed) {
              window.location.href = "/";
              return;
            }
            // Incomplete profile — resume at the profile step.
            setPhone(profile.phone || "");
            setUserProfile(profile);
            setRole(profile.role || "customer");
            setStep("profile");
            setCheckingAuth(false);
            return;
          } catch (e) {
            // fall through to clean sign-out
          }
        }
        window.location.href = "/";
        return;
      }
      try {
        await signOutFirebase();
      } catch (e) {
        // ignore
      }
      if (!active) return;
      setCheckingAuth(false);
    })();
    return () => {
      active = false;
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
    console.error("[FirebaseAuth] Auth error:", err?.code, err?.message, err);
    setDebugError(err);
    const map = {
      "auth/invalid-phone-number":
        "Please enter a valid phone number with country code (e.g. +254712345678).",
      "auth/missing-phone-number": "Please enter a phone number.",
      "auth/code-expired": "The verification code has expired. Please request a new one.",
      "auth/invalid-verification-code": "Incorrect code. Please check and try again.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/quota-exceeded": "SMS quota exceeded. Use a test number or try again later.",
      "auth/captcha-check-failed":
        "reCAPTCHA verification failed. Please refresh and try again.",
      "auth/operation-not-allowed":
        "Phone sign-in is not enabled. Enable it in the Firebase Console.",
      "auth/configuration-not-found":
        "Firebase Phone Auth is not configured. Enable Phone Authentication and add your domain to the authorized domains list in the Firebase Console.",
    };
    setError(
      map[err.code] || err.message || "Something went wrong. Please try again."
    );
  };

  // ─── Phone submit ──────────────────────────────────────────────
  // Check if the number already has an account:
  //   - Exists + PIN  → PIN login (no OTP sent)
  //   - Not exists     → send OTP to begin registration
  const handlePhoneSubmit = async () => {
    setError(null);
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) {
      setError("Please enter a valid phone number with country code.");
      return;
    }
    setPhone(normalized);
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("getUserProfile", {
        phone: normalized,
      });
      const profile = data?.profile;

      if (profile && profile.pin_hash) {
        // Returning user — log in with PIN, no OTP.
        setUserProfile(profile);
        setStep("pin-login");
      } else {
        // New number — verify via OTP, then choose role + set PIN.
        const confirmation = await sendPhoneCode(normalized);
        setConfirmationResult(confirmation);
        setStep("otp");
        setResendTimer(60);
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code) => {
    setError(null);
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(code);
      const firebaseUser = result.user;
      setPhone(firebaseUser.phoneNumber);

      if (isResettingPin) {
        // PIN reset: set a new PIN.
        setStep("pin-setup");
      } else {
        // New registration: choose account type, then set PIN.
        setStep("role");
      }
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
      const confirmation = await sendPhoneCode(phone);
      setConfirmationResult(confirmation);
      setResendTimer(60);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (r) => {
    setRole(r);
    setStep("pin-setup");
  };

  const setupPin = async (pin) => {
    setError(null);
    setLoading(true);
    try {
      const pinHash = await hashPin(pin);
      const auth = await getAuthInstance();
      const firebaseUser = auth.currentUser;

      if (isResettingPin) {
        // Reset PIN for an existing account (preserves all other profile data).
        const { data } = await base44.functions.invoke("resetPin", {
          phone,
          pin_hash: pinHash,
          firebase_uid: firebaseUser?.uid,
        });
        const profile = data?.profile;
        setPinSession(profile);
        window.location.href = "/";
      } else {
        // New registration: save initial profile with PIN + role.
        const { data } = await base44.functions.invoke("saveUserProfile", {
          phone,
          firebase_uid: firebaseUser?.uid,
          pin_hash: pinHash,
          role,
          profile_completed: false,
        });
        setUserProfile(data?.profile);
        setStep("profile");
      }
    } catch (err) {
      setError(err.message || "Failed to save PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithPin = async (pin) => {
    setError(null);
    setLoading(true);
    try {
      const pinHash = await hashPin(pin);
      if (pinHash === userProfile?.pin_hash) {
        if (userProfile?.profile_completed) {
          setPinSession(userProfile);
          window.location.href = "/";
        } else {
          // Resume an incomplete registration at the profile step.
          setRole(userProfile?.role || "customer");
          setStep("profile");
        }
      } else {
        setError("Incorrect PIN. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Failed to verify PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const forgotPin = async () => {
    setError(null);
    setIsResettingPin(true);
    setLoading(true);
    try {
      const confirmation = await sendPhoneCode(phone);
      setConfirmationResult(confirmation);
      setStep("otp");
      setResendTimer(60);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profileData) => {
    setError(null);
    setLoading(true);
    try {
      const auth = await getAuthInstance();
      const firebaseUser = auth.currentUser;

      const { data } = await base44.functions.invoke("saveUserProfile", {
        ...profileData,
        phone,
        firebase_uid: firebaseUser?.uid,
        pin_hash: userProfile?.pin_hash,
        role,
        verify_id: true,
      });

      if (data?.id_verified) {
        setPinSession(data?.profile);
        window.location.href = role === "provider" ? "/become-provider" : "/";
      } else {
        setError(
          "ID verification failed. The names on your ID don't match the names you provided. Please check your details and try again."
        );
      }
    } catch (err) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SafeAreaPage>
      <header className="flex items-center justify-center gap-2 px-4 md:px-6 h-14 shrink-0 border-b border-border">
        <img
          src={LOGO_URL}
          alt="Neighbourhood Labour Connect"
          className="w-8 h-8 rounded-xl object-cover"
        />
        <span className="font-display font-extrabold text-foreground text-sm md:text-base">
          Neighbourhood Labour Connect
        </span>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-start justify-center px-4 pt-6 pb-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Secure phone verification · Your data is protected</span>
          </div>
          {step === "phone" && (
            <>
              <AuthDebugPanel error={debugError} />
              <PhoneStep
              phone={phone}
              setPhone={setPhone}
              onSendCode={handlePhoneSubmit}
              loading={loading}
              error={error}
            />
            </>
          )}
          {step === "otp" && (
            <OtpStep
              phone={phone}
              onVerify={verifyCode}
              onResend={resendCode}
              onBack={() => {
                setStep("phone");
                setError(null);
                setIsResettingPin(false);
              }}
              loading={loading}
              error={error}
              resendTimer={resendTimer}
            />
          )}
          {step === "role" && (
            <RoleStep onSelect={selectRole} loading={loading} />
          )}
          {step === "pin-setup" && (
            <PinStep
              mode="setup"
              onConfirm={setupPin}
              loading={loading}
              error={error}
            />
          )}
          {step === "pin-login" && (
            <PinStep
              mode="login"
              onConfirm={loginWithPin}
              onForgotPin={forgotPin}
              onBack={() => {
                setStep("phone");
                setError(null);
                setUserProfile(null);
              }}
              infoMessage="This phone number is already registered. Please enter your PIN to continue."
              loading={loading}
              error={error}
            />
          )}
          {step === "profile" && (
            <ProfileSetupStep
              onSave={saveProfile}
              loading={loading}
              error={error}
            />
          )}
        </div>
        </div>
      </main>

      <footer className="px-6 py-3 text-center safe-area-bottom border-t border-border space-y-1.5">
        <a
          href="https://wa.me/254706692111?text=Hi%20NLC%20Support%2C%20I%20need%20help%20signing%20in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <HelpCircle className="w-3.5 h-3.5" /> Need help? Contact support
        </a>
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Neighbourhood Labour Connect
        </p>
      </footer>
    </SafeAreaPage>
  );
}