import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Shield, Users, Wifi, DollarSign, Briefcase, Star, Loader2, MapPin, CheckCircle2, Bell } from "lucide-react";
import SubscriptionManager from "@/components/admin/SubscriptionManager";

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);

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
        setUsers(data.userProfiles || []);
        setStats(data.stats || {});
        try {
          const { data: monitoring } = await base44.functions.invoke("getAdminStats", {});
          setAdminStats(monitoring);
        } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isAuthenticated, navigate]);

  if (!isAuthenticated || !user || user.role !== "admin") return null;

  return (
    <div className="h-full overflow-y-auto max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
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
          {/* Platform overview */}
          <h2 className="text-lg font-bold text-foreground mb-3">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <StatCard icon={Users} label="Registered Users" value={stats.registeredUsers || 0} colorClass="text-[#2D7A3E]" bgClass="bg-[#C9E8D8]" />
            <StatCard icon={Wifi} label="Live Users" value={stats.liveUsers || 0} colorClass="text-[#1A6FB0]" bgClass="bg-[#D6E8F5]" />
            <StatCard icon={DollarSign} label="App Income (USD)" value={stats.income || 0} colorClass="text-[#B36D25]" bgClass="bg-[#F5DCC8]" />
            <StatCard icon={Briefcase} label="Providers" value={stats.providers || 0} colorClass="text-[#1A1F2E]" bgClass="bg-[#E8EAF0]" />
          </div>

          {/* Job stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <StatCard icon={Briefcase} label="Total Jobs" value={stats.jobs || 0} colorClass="text-[#1A1F2E]" bgClass="bg-[#E8EAF0]" />
            <StatCard icon={Briefcase} label="Open Jobs" value={stats.openJobs || 0} colorClass="text-[#B36D25]" bgClass="bg-[#F5DCC8]" />
            <StatCard icon={Star} label="Reviews" value={stats.reviews || 0} colorClass="text-[#2D7A3E]" bgClass="bg-[#C9E8D8]" />
          </div>

          {/* All users */}
          <h2 className="text-lg font-bold text-foreground mb-3">All Users ({users.length})</h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden mb-8">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold overflow-hidden shrink-0">
                  {u.profile_photo_url ? (
                    <img src={u.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (u.first_name?.[0] || u.phone?.[0] || "?")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {`${u.first_name || ""} ${u.surname || ""}`.trim() || u.phone}
                  </p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    {u.phone}
                    {u.location_name && (
                      <>
                        <span>·</span>
                        <MapPin className="w-3 h-3" />
                        {u.location_name}
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    u.role === "admin" ? "bg-[#C9E8D8] text-[#2D7A3E]" :
                    u.role === "provider" ? "bg-[#F5DCC8] text-[#B36D25]" :
                    "bg-secondary text-secondary-foreground"
                  }`}>
                    {u.role || "customer"}
                  </span>
                  {u.profile_completed && (
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A3E]" />
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-muted-foreground text-sm px-5 py-8 text-center">No users yet.</p>
            )}
          </div>

          {/* Service providers */}
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

          {/* Real-time monitoring */}
          {adminStats && (
            <>
              <h2 className="text-lg font-bold text-foreground mb-3 mt-8">Real-Time Monitoring</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <StatCard icon={Wifi} label="Online Now" value={adminStats.onlineUsersCount} colorClass="text-[#1A6FB0]" bgClass="bg-[#D6E8F5]" />
                <StatCard icon={Briefcase} label="Online Providers" value={adminStats.onlineProvidersCount} colorClass="text-[#2D7A3E]" bgClass="bg-[#C9E8D8]" />
                <StatCard icon={CheckCircle2} label="Active Subs" value={adminStats.activeSubscriptionsCount} colorClass="text-[#B36D25]" bgClass="bg-[#F5DCC8]" />
                <StatCard icon={Bell} label="Notifs Sent" value={adminStats.notificationStats?.sent || 0} colorClass="text-[#6C5CE7]" bgClass="bg-[#E8E0F5]" />
              </div>

              <h3 className="text-sm font-bold text-foreground mb-2">Notification Delivery</h3>
              <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Delivery Rate</span>
                  <span className="text-lg font-bold text-foreground">{adminStats.notificationStats?.deliveryRate || "100%"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#C9E8D8] rounded-xl p-3">
                    <p className="text-2xl font-bold text-[#2D7A3E]">{adminStats.notificationStats?.sent || 0}</p>
                    <p className="text-xs text-[#2D7A3E] opacity-80">Delivered</p>
                  </div>
                  <div className="bg-[#F5DCC8] rounded-xl p-3">
                    <p className="text-2xl font-bold text-[#B36D25]">{adminStats.notificationStats?.failed || 0}</p>
                    <p className="text-xs text-[#B36D25] opacity-80">Failed</p>
                  </div>
                </div>
              </div>

              {adminStats.failedNotifications?.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-foreground mb-2">Recent Failed Notifications</h3>
                  <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden mb-6">
                    {adminStats.failedNotifications.map((n, i) => (
                      <div key={i} className="px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">{n.title || n.type}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{n.user_name || "—"}</span>
                        </div>
                        <p className="text-xs text-destructive truncate">{n.error || "Unknown error"}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 className="text-sm font-bold text-foreground mb-2">
                User Presence ({adminStats.allUsersPresence?.length || 0} total · {adminStats.onlineUsersCount || 0} online)
              </h3>
              <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden mb-6">
                {(adminStats.allUsersPresence || []).map((u, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        u.is_online ? "bg-green-500 animate-pulse" : "bg-red-500"
                      }`}
                      title={u.is_online ? "Online" : "Offline"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {u.is_online ? (
                          <span className="text-green-600 font-medium">Online now</span>
                        ) : (
                          <>Last seen {formatLastSeen(u.last_active)}</>
                        )}
                        {u.provider_status && u.role === "provider" && (
                          <span className="ml-1.5 text-primary font-medium">· {u.provider_status}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{u.role}</span>
                  </div>
                ))}
                {(!adminStats.allUsersPresence || adminStats.allUsersPresence.length === 0) && (
                  <p className="text-muted-foreground text-sm px-4 py-8 text-center">No presence data yet.</p>
                )}
              </div>
            </>
          )}

          <SubscriptionManager />
        </>
      )}
    </div>
  );
}

function formatLastSeen(iso) {
  if (!iso) return "unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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