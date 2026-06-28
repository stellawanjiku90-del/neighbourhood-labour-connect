import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Shield, Users, Briefcase, Star, Loader2 } from "lucide-react";
import SubscriptionManager from "@/components/admin/SubscriptionManager";

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user && user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }
    if (!user) return;

    (async () => {
      try {
        const { data } = await base44.functions.invoke("getAdminData", {
          firebase_uid: user.id,
        });
        setProviders(data.providers || []);
        setStats(data.stats || { providers: 0, jobs: 0, openJobs: 0, reviews: 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isAuthenticated, navigate]);

  if (!isAuthenticated || !user || user.role !== "admin") return null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-[#2D7A3E]" />
        <h1 className="text-2xl font-extrabold text-foreground">Admin Panel</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <StatCard icon={Users} label="Providers" value={stats.providers} colorClass="text-[#2D7A3E]" bgClass="bg-[#C9E8D8]" />
            <StatCard icon={Briefcase} label="Total Jobs" value={stats.jobs} colorClass="text-[#1A1F2E]" bgClass="bg-[#E8EAF0]" />
            <StatCard icon={Briefcase} label="Open Jobs" value={stats.openJobs} colorClass="text-[#B36D25]" bgClass="bg-[#F5DCC8]" />
            <StatCard icon={Star} label="Reviews" value={stats.reviews} colorClass="text-[#2D7A3E]" bgClass="bg-[#C9E8D8]" />
          </div>

          <h2 className="text-lg font-bold text-foreground mb-3">Service Providers</h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                  {p.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(p.professions || []).join(", ") || "No categories"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-foreground">★ {p.rating?.toFixed(1) || "0.0"}</p>
                  <p className="text-xs text-muted-foreground">{p.completed_jobs || 0} jobs</p>
                </div>
              </div>
            ))}
            {providers.length === 0 && (
              <p className="text-muted-foreground text-sm px-5 py-8 text-center">No providers yet.</p>
            )}
          </div>

          <SubscriptionManager />
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, colorClass, bgClass }) {
  return (
    <div className={`rounded-2xl p-4 md:p-5 ${bgClass}`}>
      <Icon className={`w-6 h-6 mb-2 ${colorClass}`} />
      <p className={`text-3xl md:text-4xl font-extrabold ${colorClass}`}>{value}</p>
      <p className={`text-xs md:text-sm mt-1 ${colorClass} opacity-80`}>{label}</p>
    </div>
  );
}