import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const OPTIONS = [
  {
    value: "customer",
    title: "I need help",
    desc: "Find and hire trusted local service providers for your tasks.",
  },
  {
    value: "provider",
    title: "I provide services (Pro)",
    desc: "Offer your skills to nearby customers and grow your work.",
  },
];

export default function RoleStep({ onSelect, loading }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-extrabold text-foreground mb-6">
        How will you use NLC?
      </h1>

      <div className="space-y-3 mb-6">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={loading}
            onClick={() => onSelect(o.value)}
            className="w-full flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:border-[#2D7A3E] hover:bg-secondary/40 transition text-left disabled:opacity-50"
          >
            <div className="min-w-0">
              <p className="font-bold text-foreground">{o.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{o.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}