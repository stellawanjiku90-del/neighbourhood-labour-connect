import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  subscribeAuthState,
  sendPhoneCode,
  clearRecaptchaVerifier,
  getAuthInstance,
} from "@/lib/firebase";
import { hashPin } from "@/lib/pin";
import PhoneStep from "@/components/firebase/PhoneStep";
import OtpStep from "@/components/firebase/OtpStep";
import PinStep from "@/components/firebase/PinStep";
import ProfileSetupStep from "@/components/firebase/ProfileSetupStep";

const LOGO_URL =
  "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function FirebaseAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const initialCheckDone = useRef(false);

  // Check Firebase auth state on mount (runs once)
  useEffect(() => {
    let active = true;
    let unsub = () => {};

    subscribeAuthState(async (firebaseUser) => {
      if (!active || initialCheckDone.current) return;
      initialCheckDone.current = true;

      if (firebaseUser) {
        const userPhone = firebaseUser.phoneNumber;
        setPhone(userPhone);
        try {
          const { data } = await base44.functions.invoke("getUserProfile", {
            phone: userPhone,
          });
          const profile = data?.profile;
          setUserProfile(profile);

          if (profile?.profile_completed && profile?.pin_hash) {
            if (sessionStorage.getItem("pin_verified") === "true") {
              navigate("/");
              return;
            }
            setStep("pin-login");
          } else if (profile?.pin_hash) {
            setStep("profile");
          } else {
            setStep("pin-setup");
          }
        } catch (e) {
          setStep("pin-setup");
        }
      } else {
        setStep("phone");
      }
      setCheckingAuth(false);
    })
      .then((u) => {
        unsub = u || (() => {});
      })
      .catch(() => {
        if (!active) return;
        setStep("phone");
        setCheckingAuth(false);
      });

    return () => {
      active = false;
      unsub();
      clearRecaptchaVerifier();
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

  const sendCode = async () => {
    setError(null);
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) {
      setError("Please enter a valid phone number with country code.");
      return;
    }
    setLoading(true);
    try {
      const confirmation = await sendPhoneCode(normalized);
      setConfirmationResult(confirmation);
      setPhone(normalized);
      setStep("otp");
      setResendTimer(60);
    } catch (err) {
      handleAuthError(err);
      // Do NOT clear the verifier on captcha-check-failed — that error is a
      // server-side hostname validation issue, not a client-side reCAPTCHA
      // failure. The verifier is still rendered and can be reused. Clearing
      // it here causes "already rendered" on the next attempt.
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
      const userPhone = firebaseUser.phoneNumber;
      setPhone(userPhone);

      const { data } = await base44.functions.invoke("getUserProfile", {
        phone: userPhone,
      });
      const profile = data?.profile;
      setUserProfile(profile);

      if (isResettingPin) {
        setStep("pin-setup");
      } else if (profile?.pin_hash) {
        setStep("pin-login");
      } else {
        setStep("pin-setup");
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
      // Verifier is reused — see comment in sendCode()
    } finally {
      setLoading(false);
    }
  };

  const setupPin = async (pin) => {
    setError(null);
    setLoading(true);
    try {
      const pinHash = await hashPin(pin);
      const auth = await getAuthInstance();
      const firebaseUser = auth.currentUser;

      const { data } = await base44.functions.invoke("saveUserProfile", {
        phone,
        firebase_uid: firebaseUser?.uid,
        pin_hash: pinHash,
        profile_completed: false,
      });
      setUserProfile(data?.profile);

      if (isResettingPin) {
        sessionStorage.setItem("pin_verified", "true");
        navigate("/");
      } else {
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
        sessionStorage.setItem("pin_verified", "true");
        navigate("/");
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
      // Verifier is reused — see comment in sendCode()
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
        verify_id: true,
      });

      if (data?.id_verified) {
        sessionStorage.setItem("pin_verified", "true");
        navigate("/");
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-2 px-6 h-20 shrink-0">
        <img
          src={LOGO_URL}
          alt="Neighbourhood Labour Connect"
          className="w-9 h-9 rounded-full object-cover"
        />
        <span className="font-extrabold text-foreground">
          Neighbourhood Labour Connect
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {step === "phone" && (
            <PhoneStep
              phone={phone}
              setPhone={setPhone}
              onSendCode={sendCode}
              loading={loading}
              error={error}
            />
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
      </main>

      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Neighbourhood Labour Connect
        </p>
      </footer>
    </div>
  );
}