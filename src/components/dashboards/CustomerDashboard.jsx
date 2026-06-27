import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategorySearch from "@/components/CategorySearch";
import ProviderCard from "@/components/ProviderCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import LegalLinks from "@/components/LegalLinks";
import { Plus, Siren, Users } from "lucide-react";

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
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background safe-area-inset">
      {/* Header */}
      <header className="shrink-0 px-4 py-2.5 border-b border-border bg-background safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Logo" className="w-7 h-7 rounded-lg" />
            <h1 className="text-base font-semibold text-foreground">{firstName}</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/post")} className="rounded-lg h-8 w-8 p-0 bg-primary hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => navigate("/providers")} variant="outline" className="rounded-lg h-8 w-8 p-0">
              <Users className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="shrink-0 px-4 py-1.5 bg-background">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              activeTab === "overview" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              activeTab === "providers" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => navigate("/post?emergency=1")}
            className="flex-1 text-xs font-medium py-1.5 rounded-md text-[#B36D25] bg-[#F5DCC8]/50 hover:bg-[#F5DCC8]/70 transition-colors"
          >
            <Siren className="w-3 h-3 inline mr-0.5" /> Emergency
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-2">
        {activeTab === "overview" && (
          <div className="h-full flex flex-col gap-2">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <p className="text-lg font-bold text-foreground">{top.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Providers</p>
              </div>
              <div className="bg-[#C9E8D8] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-[#2D7A3E]">{openJobs}</p>
                <p className="text-[10px] text-[#2D7A3E]/80 mt-0.5">Open jobs</p>
              </div>
              <Link to="/post?emergency=1" className="bg-[#F5DCC8] rounded-lg p-2 flex flex-col items-center justify-center">
                <Siren className="w-4 h-4 text-[#B36D25]" />
                <p className="text-[10px] font-semibold text-[#B36D25] mt-0.5">Urgent</p>
              </Link>
            </div>

            {/* Search */}
            <CategorySearch
              value=""
              onChange={(v) => v && navigate(`/providers?category=${encodeURIComponent(v)}`)}
              placeholder="Search service…"
            />

            {/* Providers carousel */}
            <div className="flex-1 min-h-0 overflow-x-auto -mx-4 px-4">
              <div className="flex gap-2 pb-2 h-full">
                {top.slice(0, 5).map((p) => (
                  <div key={p.id} className="min-w-[170px] shrink-0">
                    <ProviderCard provider={p} compact />
                  </div>
                ))}
              </div>
            </div>

            <LegalLinks />
          </div>
        )}

        {activeTab === "providers" && (
          <div className="h-full flex flex-col">
            <h2 className="text-xs font-semibold text-foreground mb-2">Top Rated Providers</h2>
            <div className="flex-1 min-h-0 overflow-x-auto -mx-4 px-4">
              <div className="flex gap-2 pb-2 h-full">
                {top.map((p) => (
                  <div key={p.id} className="min-w-[170px] shrink-0">
                    <ProviderCard provider={p} compact />
                  </div>
                ))}
              </div>
            </div>
            <LegalLinks />
          </div>
        )}
      </div>
    </div>
  );
}