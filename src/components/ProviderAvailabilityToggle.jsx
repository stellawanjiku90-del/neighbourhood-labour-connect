import React, { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUSES = [
  { value: "online", label: "Online", desc: "Visible as online", color: "bg-green-500" },
  { value: "available", label: "Available for Work", desc: "Accepting new jobs", color: "bg-green-500" },
  { value: "busy", label: "Busy", desc: "Currently working, not accepting jobs", color: "bg-amber-500" },
  { value: "offline", label: "Offline", desc: "Hidden from search, no notifications", color: "bg-muted-foreground/40" },
];

export default function ProviderAvailabilityToggle({ currentStatus, onUpdated }) {
  const [status, setStatus] = useState(currentStatus || "available");
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(null);

  const handleChange = async (newStatus) => {
    if (newStatus === status) return;
    setStatus(newStatus);
    setSaving(true);
    setSavedStatus(null);
    try {
      await base44.functions.invoke("setProviderAvailability", { status: newStatus });
      setSavedStatus(newStatus);
      if (onUpdated) onUpdated(newStatus);
      setTimeout(() => setSavedStatus(null), 2000);
    } catch {
      setStatus(currentStatus || "available");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-2">
      {STATUSES.map((s) => {
        const isSelected = status === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => handleChange(s.value)}
            disabled={saving}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-left ${
              isSelected
                ? "border-primary bg-accent/50"
                : "border-border hover:bg-accent/30"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${s.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.desc}</p>
            </div>
            {isSelected && savedStatus === s.value && <Check className="w-4 h-4 text-primary shrink-0" />}
            {isSelected && saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}