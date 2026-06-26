import { Phone, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PhoneStep({ phone, setPhone, onSendCode, loading, error }) {
  return (
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
        onKeyDown={(e) => e.key === "Enter" && !loading && onSendCode()}
      />
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <Button
        onClick={onSendCode}
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
  );
}