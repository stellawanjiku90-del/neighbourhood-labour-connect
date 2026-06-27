import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategorySearch from "@/components/CategorySearch";
import ProviderCard from "@/components/ProviderCard";
import PushNotificationEnabler from "@/components/PushNotificationEnabler";
import PullToRefresh from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Siren, TrendingUp } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [top, setTop] = useState([]);
  const [openJobs, setOpenJobs] = useState(0);

  useEffect(() => {
    base44.entities.ServiceProvider.filter({ available: true }, "-rating", 6).then(setTop);
    base44.entities.ServiceRequest.filter({ status: "open" }, "-created_date", 100).then((r) =>
      setOpenJobs(r.length)
    );
  }, []);

  const refresh = async () => {
    const [topData, jobsData] = await Promise.all([
      base44.entities.ServiceProvider.filter({ available: true }, "-rating", 6),
      base44.entities.ServiceRequest.filter({ status: "open" }, "-created_date", 100),
    ]);
    setTop(topData);
    setOpenJobs(jobsData.length);
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Header - compact */}
      <header className="shrink-0 px-4 md:px-8 py-3 border-b border-slate-100 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="w-7 h-7 rounded-full object-cover md:hidden" />
            <div>
              <p className="text-xs text-muted-foreground">{greet}</p>
              <h1 className="text-lg font-extrabold text-foreground">{firstName} 👋</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/post")} className="rounded-xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-9 px-3 text-xs">
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Post</span>
            </Button>
            <Button onClick={() => navigate("/providers")} variant="outline" className="rounded-xl h-9 px-3 text-xs">
              <span className="hidden sm:inline">Find Help</span><span className="sm:hidden">Browse</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-3">
        <div className="max-w-5xl mx-auto space-y-3">
          <PushNotificationEnabler />

          {/* Stats - compact */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-2.5 border border-slate-100">
              <p className="text-2xl font-extrabold text-foreground">{top.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Providers</p>
            </div>
            <div className="bg-[#C9E8D8] rounded-xl p-2.5">
              <p className="text-2xl font-extrabold text-[#2D7A3E]">{openJobs}</p>
              <p className="text-[10px] text-[#2D7A3E]/80 mt-0.5">Open jobs</p>
            </div>
            <Link to="/post?emergency=1" className="bg-[#F5DCC8] rounded-xl p-2.5 flex flex-col justify-center">
              <Siren className="w-4 h-4 text-[#B36D25] mb-1" />
              <p className="text-[10px] font-semibold text-[#B36D25]">Emergency</p>
            </Link>
          </div>

          {/* Search */}
          <div>
            <p className="text-xs font-semibold mb-1.5">Find a service</p>
            <CategorySearch
              value=""
              onChange={(v) => v && navigate(`/providers?category=${encodeURIComponent(v)}`)}
              placeholder="Search category…"
            />
          </div>

          {/* Top providers carousel */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-[#2D7A3E]" />
              <h2 className="text-sm font-bold text-foreground">Top rated</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
              {top.map((p) => (
                <div key={p.id} className="min-w-[85%] sm:min-w-[240px] snap-start shrink-0">
                  <ProviderCard provider={p} />
                </div>
              ))}
              {top.length === 0 && (
                <p className="text-muted-foreground text-xs">No providers yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}