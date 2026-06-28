import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Users, DollarSign, Copy, Check, Share2, Loader2, Gift } from "lucide-react";

export default function Referrals() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    base44.functions
      .invoke("getReferralDashboard", { firebase_uid: user.id })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const copyCode = () => {
    if (!data?.referral_code) return;
    navigator.clipboard.writeText(data.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = `https://wa.me/?text=${encodeURIComponent(
    `Join Neighbourhood Labour Connect! Use my referral code ${data?.referral_code || ""} when you sign up.`
  )}`;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const levelEarnings = [0, 0, 0];
  (data?.earnings || []).forEach((e) => {
    if (e.level >= 1 && e.level <= 3) levelEarnings[e.level - 1] += e.amount || 0;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-foreground mb-1">Referral Program</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Earn when your friends subscribe — up to 3 levels deep.
      </p>

      {/* Referral code card */}
      <div className="bg-gradient-to-br from-[#2D7A3E] to-[#246332] rounded-2xl p-5 text-white mb-6">
        <p className="text-sm opacity-90 mb-1">Your referral code</p>
        <div className="flex items-center gap-3">
          <p className="text-2xl font-extrabold tracking-wide">{data?.referral_code || "—"}</p>
          <button
            onClick={copyCode}
            className="ml-auto bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy
              </>
            )}
          </button>
        </div>
        <a
          href={shareLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 bg-white text-[#2D7A3E] rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Share2 className="w-4 h-4" /> Share on WhatsApp
        </a>
      </div>

      {/* Earnings rates */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <RateCard level={1} rate="10%" amount={levelEarnings[0]} />
        <RateCard level={2} rate="5%" amount={levelEarnings[1]} />
        <RateCard level={3} rate="2%" amount={levelEarnings[2]} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={Users} label="Referrals" value={data?.referral_count || 0} />
        <StatCard icon={Check} label="Subscribed" value={data?.subscribed_count || 0} />
        <StatCard icon={DollarSign} label="Total Earned" value={`$${(data?.total_earnings || 0).toFixed(2)}`} />
      </div>

      {/* Referrals list */}
      <h2 className="text-lg font-bold text-foreground mb-3">Your Referrals</h2>
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 mb-6">
        {(data?.referrals || []).map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
              {r.referred_name?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{r.referred_name || r.referred_phone}</p>
              <p className="text-xs text-muted-foreground">{r.referred_phone}</p>
            </div>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                r.status === "subscribed" ? "bg-[#C9E8D8] text-[#2D7A3E]" : "bg-muted text-muted-foreground"
              }`}
            >
              {r.status === "subscribed" ? "Subscribed" : "Registered"}
            </span>
          </div>
        ))}
        {(data?.referrals || []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No referrals yet. Share your code to start earning!
          </p>
        )}
      </div>

      {/* Earnings list */}
      <h2 className="text-lg font-bold text-foreground mb-3">Earnings History</h2>
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
        {(data?.earnings || []).map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9E8D8] flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#2D7A3E]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{e.source_name || "Subscription"}</p>
              <p className="text-xs text-muted-foreground">Level {e.level} commission</p>
            </div>
            <p className="font-bold text-[#2D7A3E]">+${(e.amount || 0).toFixed(2)}</p>
          </div>
        ))}
        {(data?.earnings || []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No earnings yet. You earn when your referrals subscribe!
          </p>
        )}
      </div>
    </div>
  );
}

function RateCard({ level, rate, amount }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">Level {level}</p>
      <p className="text-lg font-extrabold text-foreground">{rate}</p>
      <p className="text-xs text-[#2D7A3E] font-medium mt-1">${amount.toFixed(2)}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
      <Icon className="w-5 h-5 text-[#2D7A3E] mx-auto mb-1" />
      <p className="text-xl font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}