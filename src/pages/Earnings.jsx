import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Wallet, Gift, Star, Briefcase, Loader2, Check, Clock, TrendingUp } from "lucide-react";

export default function Earnings() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setLoading(true);
    base44.functions
      .invoke("getEarningsDashboard", { firebase_uid: user.id })
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) {
    return <div className="text-center py-20 text-muted-foreground">Unable to load earnings.</div>;
  }

  const isProvider = user?.role === "provider" && data.provider;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-foreground mb-1">Earnings</h1>
      <p className="text-sm text-muted-foreground mb-6">Track your job and referral earnings.</p>

      {/* Total earnings hero card */}
      <div className="bg-gradient-to-br from-[#2D7A3E] to-[#246332] rounded-2xl p-5 text-white mb-6">
        <p className="text-sm opacity-90 mb-1">Total Earnings</p>
        <p className="text-4xl font-extrabold">${(data.total_earnings || 0).toFixed(2)}</p>
        <div className="flex gap-4 mt-3 text-xs opacity-90">
          {isProvider && <span>Job: ${(data.provider.earnings || 0).toFixed(2)}</span>}
          <span>Referral: ${(data.referral.total || 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Subscription status */}
      <div
        className={`rounded-xl p-3 flex items-center gap-2 mb-6 ${
          data.subscription.active ? "bg-[#C9E8D8]" : "bg-muted"
        }`}
      >
        {data.subscription.active ? (
          <Check className="w-4 h-4 text-[#2D7A3E] shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <p className="text-sm font-medium flex-1 text-foreground">
          {data.subscription.active
            ? `Subscribed until ${new Date(data.subscription.period_end).toLocaleDateString()}`
            : "No active subscription"}
        </p>
        {!data.subscription.active && (
          <Link to="/subscribe" className="text-xs font-semibold text-[#2D7A3E] underline">
            Subscribe
          </Link>
        )}
      </div>

      {/* Provider job earnings */}
      {isProvider && (
        <>
          <h2 className="text-lg font-bold text-foreground mb-3">Job Earnings</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard icon={Wallet} label="Earned" value={`$${(data.provider.earnings || 0).toFixed(2)}`} />
            <StatCard icon={Briefcase} label="Completed" value={data.provider.completed_jobs || 0} />
            <StatCard icon={Star} label="Rating" value={(data.provider.rating || 0).toFixed(1)} />
          </div>
        </>
      )}

      {/* Referral earnings */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">Referral Earnings</h2>
        <Link to="/referrals" className="text-xs font-semibold text-[#2D7A3E] underline">
          Share code →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <RateCard level={1} rate="10%" amount={data.referral.by_level[0]} />
        <RateCard level={2} rate="5%" amount={data.referral.by_level[1]} />
        <RateCard level={3} rate="2%" amount={data.referral.by_level[2]} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
        {(data.referral.history || []).map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9E8D8] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#2D7A3E]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{e.source_name || "Subscription"}</p>
              <p className="text-xs text-muted-foreground">
                Level {e.level} · {new Date(e.created_date).toLocaleDateString()}
              </p>
            </div>
            <p className="font-bold text-[#2D7A3E] shrink-0">+${(e.amount || 0).toFixed(2)}</p>
          </div>
        ))}
        {(data.referral.history || []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No referral earnings yet. Share your code to start earning!
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
      <Icon className="w-5 h-5 text-[#2D7A3E] mx-auto mb-1" />
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
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