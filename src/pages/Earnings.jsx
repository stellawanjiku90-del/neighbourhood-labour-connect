import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/ui/use-toast";
import {
  Wallet, Gift, Star, Briefcase, Loader2, Check, Clock, Copy, Share2,
  TrendingUp, ArrowDownToLine, Sparkles,
} from "lucide-react";

export default function Earnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setLoading(true);
    base44.functions
      .invoke("getEarningsDashboard", { firebase_uid: user.id })
      .then((res) => { if (active) setData(res.data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="h-full max-w-2xl mx-auto w-full">
        <PageHeader title="Earnings" icon={Wallet} />
        <EmptyState icon={Wallet} title="Couldn't load earnings" description="Please check your connection and try again." />
      </div>
    );
  }

  const isProvider = user?.role === "provider" && data.provider;
  const referralCode = data.referral_code || null;
  const history = data.referral?.history || [];
  const total = data.total_earnings || 0;

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard?.writeText(referralCode);
    setCopied(true);
    toast({ title: "Referral code copied" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = `https://wa.me/?text=${encodeURIComponent(
    `Join Neighbourhood Labour Connect! Use my referral code ${referralCode || ""} when you sign up.`
  )}`;

  const withdrawLink = `https://wa.me/254706692111?text=${encodeURIComponent(
    `Hi, I'd like to request a withdrawal of $${total.toFixed(2)} from my NLC earnings. My code is ${referralCode || "N/A"}.`
  )}`;

  return (
    <div className="h-full flex flex-col overflow-hidden max-w-2xl mx-auto w-full">
      <PageHeader title="Earnings" subtitle="Jobs & referral income" icon={Wallet} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5">
        {/* Total earnings hero */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-5 text-primary-foreground">
          <p className="text-sm opacity-90 mb-1">Total Earnings</p>
          <p className="text-4xl font-extrabold">${total.toFixed(2)}</p>
          <div className="flex gap-4 mt-3 text-xs opacity-90">
            {isProvider && <span>Jobs: ${(data.provider.earnings || 0).toFixed(2)}</span>}
            <span>Referrals: ${(data.referral?.total || 0).toFixed(2)}</span>
          </div>
          <a
            href={withdrawLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 bg-primary-foreground text-primary rounded-xl px-4 py-2.5 text-sm font-bold"
          >
            <ArrowDownToLine className="w-4 h-4" /> Request Withdrawal
          </a>
        </div>

        {/* Subscription status */}
        <div className={`rounded-2xl p-3.5 flex items-center gap-3 ${data.subscription?.active ? "bg-accent" : "bg-muted"}`}>
          {data.subscription?.active ? (
            <Check className="w-5 h-5 text-primary shrink-0" />
          ) : (
            <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <p className="text-sm font-medium flex-1 text-foreground">
            {data.subscription?.active
              ? `Active until ${new Date(data.subscription.period_end).toLocaleDateString()}`
              : "No active subscription"}
          </p>
          {!data.subscription?.active && (
            <Link to="/subscribe" className="text-xs font-bold text-primary">Subscribe</Link>
          )}
        </div>

        {/* Referral code card */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Your referral code</h3>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-xl p-3 mb-3">
            <p className="text-xl font-extrabold tracking-wide text-foreground flex-1">
              {referralCode || "—"}
            </p>
            <button
              onClick={copyCode}
              disabled={!referralCode}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <a
            href={shareLink}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground rounded-xl py-2.5 text-sm font-bold"
          >
            <Share2 className="w-4 h-4" /> Share on WhatsApp
          </a>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Earn 10% on direct referrals, 5% on level 2, 2% on level 3.
          </p>
        </div>

        {/* Provider job stats */}
        {isProvider && (
          <section>
            <h3 className="text-sm font-bold text-foreground mb-2">Job earnings</h3>
            <div className="grid grid-cols-3 gap-2.5">
              <StatCard icon={Wallet} label="Earned" value={`$${(data.provider.earnings || 0).toFixed(0)}`} />
              <StatCard icon={Briefcase} label="Completed" value={data.provider.completed_jobs || 0} />
              <StatCard icon={Star} label="Rating" value={(data.provider.rating || 0).toFixed(1)} />
            </div>
          </section>
        )}

        {/* Referral rate cards */}
        <section>
          <h3 className="text-sm font-bold text-foreground mb-2">Commission rates</h3>
          <div className="grid grid-cols-3 gap-2.5">
            <RateCard level={1} rate="10%" amount={data.referral?.by_level?.[0] || 0} />
            <RateCard level={2} rate="5%" amount={data.referral?.by_level?.[1] || 0} />
            <RateCard level={3} rate="2%" amount={data.referral?.by_level?.[2] || 0} />
          </div>
        </section>

        {/* Earnings history */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-foreground">Earnings history</h3>
            <Link to="/referrals" className="text-xs font-semibold text-primary">Full report →</Link>
          </div>
          {history.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border">
              <EmptyState
                icon={TrendingUp}
                title="No earnings yet"
                description="Share your referral code — you earn a commission every time someone you invite subscribes."
                actionLabel="Share code"
                to="/referrals"
              />
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {history.slice(0, 12).map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{e.source_name || "Subscription"}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {e.level} · {new Date(e.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-primary shrink-0">+${(e.amount || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-3 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function RateCard({ level, rate, amount }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">Level {level}</p>
      <p className="text-lg font-extrabold text-foreground">{rate}</p>
      <p className="text-xs text-primary font-medium mt-1">${amount.toFixed(2)}</p>
    </div>
  );
}