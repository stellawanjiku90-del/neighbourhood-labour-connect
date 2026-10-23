import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { hashPin } from "@/lib/pin";
import { useAuth } from "@/lib/AuthContext";
import PhoneStep from "@/components/firebase/PhoneStep";
import IntaSendVerificationStep from "@/components/IntaSendVerificationStep";
import PinStep from "@/components/firebase/PinStep";
import ProfileSetupStep from "@/components/firebase/ProfileSetupStep";
import RoleStep from "@/components/firebase/RoleStep";
import SafeAreaPage from "@/components/SafeAreaPage";
import { ShieldCheck } from "lucide-react";

const LOGO_URL =
  "/icon.svg";

export default function PhoneAuth() {
  const navigate = useNavigate();
  const { setPinSession } = useAuth();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [verificationToken, setVerificationToken] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const [verificationAmount, setVerificationAmount] = useState(100);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState("");
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Parse URL params for referral code and role on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    const roleParam = params.get("role");
    if (ref) setReferralCodeFromUrl(ref.toUpperCase());
    if (roleParam && ["customer", "provider"].includes(roleParam)) {
      setRole(roleParam);
    }
  }, []);

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
      if (!active) return;
      setCheckingAuth(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const normalizePhone = (raw) => {
    let cleaned = raw.replace(/[^\d+]/g, "");
    if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
    return cleaned;
  };

  const handleAuthError = (err) => {
    const message = err?.data?.error || err?.message || "Something went wrong. Please try again.";
    setError(message);
  };

  // ─── Phone submit ──────────────────────────────────────────────
  // Check if the number already has an account:
  //   - Exists + PIN  → PIN login (no OTP sent)
  //   - Not exists     → send OTP to begin registration
  const handlePhoneSubmit = async () => {
    setError(null);
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) { setError("Please enter a valid phone number with country code."); return; }
    setPhone(normalized); setLoading(true);
    try {
      const { data } = await apiClient.functions.invoke("getUserProfile", { phone: normalized });
      const profile = data?.profile;
      if (profile && profile.pin_hash) {
        setUserProfile(profile); setStep("pin-login");
      } else {
        await startVerification(normalized, "registration");
      }
    } catch (err) { handleAuthError(err); }
    finally { setLoading(false); }
  };

  const startVerification = async (targetPhone = phone, purpose = "registration") => {
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/verification/start", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone:targetPhone,purpose}) });
      const payload = await res.json(); if (!res.ok) throw new Error(payload.error || "Unable to start phone verification.");
      setPhone(payload.phone || targetPhone);
      setVerificationId(payload.verification_id);
      setVerificationAmount(payload.amount_kes || 100);
      setStep("payment");
    } catch (err) { handleAuthError(err); }
    finally { setLoading(false); }
  };

  const verificationComplete = (token) => {
    setVerificationToken(token);
    if (isResettingPin || role === "customer" || role === "provider") {
      setStep("pin-setup");
    } else {
      setStep("role");
    }
  };

  const retryVerification = () => startVerification(phone, isResettingPin ? "reset_pin" : "registration");

  const selectRole = (r) => {
    setRole(r);
    setStep("pin-setup");
  };

  const setupPin = async (pin) => {
    setError(null); setLoading(true);
    try {
      const pinHash = await hashPin(pin);
      if (isResettingPin) {
        const { data } = await apiClient.functions.invoke("resetPin", { phone, pin_hash: pinHash, verification_token: verificationToken });
        await setPinSession(data?.profile); window.location.href = "/";
      } else {
        const { data } = await apiClient.functions.invoke("saveUserProfile", { phone, pin_hash: pinHash, role, profile_completed:false, verification_token: verificationToken });
        if (data?.access_token) apiClient.auth.setToken(data.access_token);
        setUserProfile(data?.profile); setStep("profile");
      }
    } catch (err) { setError(err.message || "Failed to save PIN. Please try again."); }
    finally { setLoading(false); }
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
    setError(null); setIsResettingPin(true); setLoading(true);
    try {
      await startVerification(phone, "reset_pin");
    } catch (err) { handleAuthError(err); }
    finally { setLoading(false); }
  };

  const saveProfile = async (profileData) => {
    setError(null); setLoading(true);
    try {
      const { data } = await apiClient.functions.invoke("saveUserProfile", { ...profileData, phone, pin_hash:userProfile?.pin_hash, role });
      if (data?.access_token) apiClient.auth.setToken(data.access_token);
      await setPinSession(data?.profile); window.location.href = role === "provider" ? "/become-provider" : "/";
    } catch (err) { setError(err.message || "Failed to save profile. Please try again."); }
    finally { setLoading(false); }
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
            <span>Phone sign-in · M-Pesa check for new accounts</span>
          </div>
          {step === "phone" && (
            <>
              <PhoneStep
              phone={phone}
              setPhone={setPhone}
              onSendCode={handlePhoneSubmit}
              loading={loading}
              error={error}
            />
            </>
          )}
          {step === "payment" && (
            <IntaSendVerificationStep
              phone={phone}
              verificationId={verificationId}
              amountKes={verificationAmount}
              onVerified={verificationComplete}
              onRetry={retryVerification}
              loading={loading}
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
              referralCodeFromUrl={referralCodeFromUrl}
              preselectedRole={role}
            />
          )}
        </div>
        </div>
      </main>

      <footer className="px-6 py-3 text-center safe-area-bottom border-t border-border space-y-1.5">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Neighbourhood Labour Connect
        </p>
      </footer>
    </SafeAreaPage>
  );
}