import { useEffect, useState } from "react";
import { Phone, Loader2, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountryByCode, placeholderForCountry, formatLocalNumber } from "@/lib/countries";

export default function PhoneStep({ phone, setPhone, onSendCode, loading, error }) {
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState("");
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const detected = getCountryByCode(data.country_code);
        if (detected) setCountry(detected);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setDetecting(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPhone("+" + country.dial + localNumber.replace(/\D/g, ""));
  }, [country, localNumber, setPhone]);

  // Re-format the local number when the country changes (different length/grouping)
  useEffect(() => {
    setLocalNumber((prev) => formatLocalNumber(prev, country.length));
  }, [country, setLocalNumber]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5">
        <Phone className="w-7 h-7 text-secondary-foreground" />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-6">Phone Verification</h1>
      <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
      <div className="flex gap-2 mb-2">
        <select
          value={country.code}
          onChange={(e) => {
            const next = COUNTRY_OPTIONS.find((c) => c.code === e.target.value);
            if (next) setCountry(next);
          }}
          disabled={loading}
          className="h-12 rounded-xl border border-input bg-transparent px-3 text-base font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} +{c.dial}
            </option>
          ))}
        </select>
        <Input
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={(e) => setLocalNumber(formatLocalNumber(e.target.value, country.length))}
          placeholder={placeholderForCountry(country)}
          className="h-12 rounded-xl text-base flex-1"
          disabled={loading}
          onKeyDown={(e) => e.key === "Enter" && !loading && localNumber.replace(/\D/g, "").length >= country.length && onSendCode()}
        />
      </div>
      {detecting && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
          <MapPin className="w-3 h-3" /> Detecting your country…
        </p>
      )}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <Button
        onClick={onSendCode}
        disabled={loading || localNumber.replace(/\D/g, "").length < country.length}
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