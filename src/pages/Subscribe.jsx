import { CreditCard, Check, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function Subscribe() {
  const { active, periodEnd, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (active) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C9E8D8] flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-[#2D7A3E]" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-1">Subscription Active</h1>
          <p className="text-sm text-muted-foreground">
            Your subscription is active until {new Date(periodEnd).toLocaleDateString()}.
          </p>
          <p className="text-sm text-muted-foreground mt-2">You can view profiles and chat freely.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <CreditCard className="w-7 h-7 text-secondary-foreground" />
        </div>
        <h1 className="text-xl font-extrabold text-foreground mb-2">Monthly Subscription</h1>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-extrabold text-foreground">$1</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-[#2D7A3E]" /> View service provider profiles
          </li>
          <li className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-[#2D7A3E]" /> Chat with providers and customers
          </li>
          <li className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-[#2D7A3E]" /> Unlock phone number sharing
          </li>
        </ul>
        <div className="bg-accent/60 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-accent-foreground mb-1">How to pay</p>
          <p className="text-xs text-muted-foreground">
            Send $1 (or Ksh 130 equivalent) via M-Pesa to our till number, then contact support with your phone number. Once your payment is confirmed, our team will activate your subscription and you'll be unlocked instantly.
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Your subscription is activated by our team after payment confirmation.
        </p>
      </div>
    </div>
  );
}