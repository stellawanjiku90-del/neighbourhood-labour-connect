import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CATEGORIES } from "@/lib/categories";
import CategoryIcon from "@/components/CategoryIcon";
import ProviderCard from "@/components/ProviderCard";
import PushNotificationEnabler from "@/components/PushNotificationEnabler";
import { Button } from "@/components/ui/button";
import { Plus, Siren, TrendingUp } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [top, setTop] = useState([]);
  const [openJobs, setOpenJobs] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.ServiceProvider.filter({ available: true }, "-rating", 6).then(setTop);
    base44.entities.ServiceRequest.filter({ status: "open" }, "-created_date", 100).then((r) =>
      setOpenJobs(r.length)
    );
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-muted-foreground text-sm">{greet},</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{firstName} 👋</h1>
          <p className="text-muted-foreground mt-1 max-w-md">
            Find trusted help nearby, or post a request and get offers in minutes.
          </p>
        </div>
        <Button
          onClick={() => navigate("/post")}
          className="rounded-2xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-12 px-5 shrink-0"
        >
          <Plus className="w-5 h-5 mr-1" /> <span className="hidden sm:inline">Post Request</span>
        </Button>
      </header>

      <PushNotificationEnabler />

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100">
          <p className="text-4xl md:text-5xl font-extrabold text-foreground">{top.length}</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Available now</p>
        </div>
        <div className="bg-[#C9E8D8] rounded-2xl p-4 md:p-5">
          <p className="text-4xl md:text-5xl font-extrabold text-[#2D7A3E]">{openJobs}</p>
          <p className="text-xs md:text-sm text-[#2D7A3E]/80 mt-1">Open jobs</p>
        </div>
        <Link
          to="/post?emergency=1"
          className="bg-[#F5DCC8] rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition"
        >
          <Siren className="w-7 h-7 text-[#B36D25]" />
          <p className="text-xs md:text-sm font-semibold text-[#B36D25] mt-2">Emergency</p>
        </Link>
      </div>

      {/* Categories */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">Categories</h2>
        <Link to="/providers" className="text-sm text-[#2D7A3E] font-medium">View all</Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-10">
        {CATEGORIES.slice(0, 12).map((c) => (
          <Link
            key={c.name}
            to={`/providers?category=${encodeURIComponent(c.name)}`}
            className="bg-white rounded-2xl p-3 border border-slate-100 flex flex-col items-center gap-2 text-center hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <span className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground">
              <CategoryIcon name={c.icon} />
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground line-clamp-2">
              {c.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Top rated */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-[#2D7A3E]" />
        <h2 className="text-lg font-bold text-foreground">Top rated near you</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {top.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
        {top.length === 0 && (
          <p className="text-muted-foreground text-sm">No providers available yet.</p>
        )}
      </div>
    </div>
  );
}