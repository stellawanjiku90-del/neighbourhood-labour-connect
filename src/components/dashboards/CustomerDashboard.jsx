import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategorySearch from "@/components/CategorySearch";
import ProviderCard from "@/components/ProviderCard";
import PullToRefresh from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Siren, TrendingUp, Users, Briefcase } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [top, setTop] = useState([]);
  const [openJobs, setOpenJobs] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const refresh = async () => {
    const [topData, jobsData] = await Promise.all([
      base44.entities.ServiceProvider.filter({ available: true }, "-rating", 6),
      base44.entities.ServiceRequest.filter({ status: "open" }, "-created_date", 100),
    ]);
    setTop(topData);
    setOpenJobs(jobsData.length);
  };

  useEffect(() => {
    refresh();
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Ultra-compact header */}
      <header className="shrink-0 px-4 py-2 border-b border-slate-100 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="w-6 h-6 rounded-full" />
            <h1 className="text-base font-bold text-foreground">{firstName}</h1>
          </div>
          <div className="flex gap-1.5">
            <Button onClick={() => navigate("/post")} className="rounded-lg bg-[#1A1F2E] h-8 px-2.5 text-xs">
              <Plus className="w-3 h-3" />
            </Button>
            <Button onClick={() => navigate("/providers")} variant="outline" className="rounded-lg h-8 px-2.5 text-xs">
              <Users className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="shrink-0 px-4 py-2 border-b border-slate-100 bg-background">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md ${activeTab === "overview" ? "bg-[#C9E8D8] text-[#2D7A3E]" : "text-muted-foreground"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md ${activeTab === "providers" ? "bg-[#C9E8D8] text-[#2D7A3E]" : "text-muted-foreground"}`}
          >
            Providers
          </button>
          <button
            onClick={() => navigate("/post?emergency=1")}
            className="flex-1 text-xs font-medium py-1.5 rounded-md text-[#B36D25] bg-[#F5DCC8]/50"
          >
            <Siren className="w-3 h-3 inline mr-0.5" /> Emergency
          </button>
        </div>
      </div>

      {/* Content area - no scroll */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-2">
        {activeTab === "overview" && (
          <div className="h-full flex flex-col gap-2">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-white rounded-lg p-2 border border-slate-100 text-center">
                <p className="text-lg font-bold text-foreground">{top.length}</p>
                <p className="text-[9px] text-muted-foreground">Providers</p>
              </div>
              <div className="bg-[#C9E8D8] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-[#2D7A3E]">{openJobs}</p>
                <p className="text-[9px] text-[#2D7A3E]/80">Open jobs</p>
              </div>
              <Link to="/post?emergency=1" className="bg-[#F5DCC8] rounded-lg p-2 flex flex-col items-center justify-center">
                <Siren className="w-3 h-3 text-[#B36D25]" />
                <p className="text-[9px] font-semibold text-[#B36D25]">Urgent</p>
              </Link>
            </div>

            {/* Search */}
            <CategorySearch
              value=""
              onChange={(v) => v && navigate(`/providers?category=${encodeURIComponent(v)}`)}
              placeholder="Search service…"
            />

            {/* Top providers - horizontal scroll only */}
            <div className="flex-1 min-h-0 overflow-x-auto">
              <div className="flex gap-1.5 pb-1 h-full">
                {top.slice(0, 4).map((p) => (
                  <div key={p.id} className="min-w-[160px] shrink-0">
                    <ProviderCard provider={p} compact />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "providers" && (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#2D7A3E]" />
              <h2 className="text-xs font-bold text-foreground">Top Rated</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-x-auto">
              <div className="flex gap-1.5 pb-1 h-full">
                {top.map((p) => (
                  <div key={p.id} className="min-w-[160px] shrink-0">
                    <ProviderCard provider={p} compact />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}