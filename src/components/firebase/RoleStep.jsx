import { HandHelping, ShoppingBag } from "lucide-react";

const OPTIONS = [
  {
    value: "customer",
    icon: ShoppingBag,
    title: "I need help",
    desc: "Find and hire trusted local service providers for your tasks.",
  },
  {
    value: "provider",
    icon: HandHelping,
    title: "I provide services (Pro)",
    desc: "Offer your skills to nearby customers and grow your work.",
  },
];

export default function RoleStep({ onSelect, loading }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5">
        <HandHelping className="w-7 h-7 text-secondary-foreground" />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        How will you use NLC?
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        Choose how you'll use Neighbourhood Labour Connect. You can always offer
        services later from Settings.
      </p>

      <div className="space-y-3 mb-6">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={loading}
            onClick={() => onSelect(o.value)}
            className="w-full flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:border-[#2D7A3E] hover:bg-secondary/40 transition text-left disabled:opacity-50"
          >
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <o.icon className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground">{o.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{o.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your phone number is your account — it stays the same whichever you choose.
      </p>
    </div>
  );
}