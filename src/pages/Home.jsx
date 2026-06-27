import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategorySearch from "@/components/CategorySearch";
import ProviderCard from "@/components/ProviderCard";
import PushNotificationEnabler from "@/components/PushNotificationEnabler";
import PullToRefresh from "@/components/PullToRefresh";
import LandingPage from "@/components/LandingPage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Siren, TrendingUp } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function Home() {
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

  // Show landing page for visitors who aren't logged in
  if (!user) {
    return <LandingPage />;
  }

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 md:py-6">
        {/* Brand bar */}
        <div className="flex items-center gap-2 mb-6 md:hidden">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-extrabold text-foreground">Neighbourhood Labour Connect</span>
        </div>

        {/* Hero */}
        <header className="mb-5">
          <p className="text-muted-foreground text-sm">{greet},</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{firstName} 👋</h1>
          <p className="text-muted-foreground mt-1 max-w-md">
            Need a hand? Find trusted people in your neighbourhood — or post a job and let them come to you.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => navigate("/post")}
              className="rounded-2xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-12 px-5"
            >
              <Plus className="w-5 h-5 mr-1" /> Post a Job
            </Button>
            <Button
              onClick={() => navigate("/providers")}
              variant="outline"
              className="rounded-2xl h-12 px-5"
            >
              Find Help
            </Button>
          </div>
        </header>

        <PushNotificationEnabler />

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100">
            <p className="text-4xl md:text-5xl font-extrabold text-foreground">{top.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Ready to help</p>
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

        {/* Search categories */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Find a service</h2>
          <CategorySearch
            value=""
            onChange={(v) => v && navigate(`/providers?category=${encodeURIComponent(v)}`)}
            placeholder="Search for a service category…"
          />
        </div>

        {/* Top rated */}
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-[#2D7A3E]" />
          <h2 className="text-lg font-bold text-foreground">Top rated near you</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {top.map((p) => (
            <div key={p.id} className="min-w-[78%] sm:min-w-[260px] snap-start shrink-0">
              <ProviderCard provider={p} />
            </div>
          ))}
          {top.length === 0 && (
            <p className="text-muted-foreground text-sm">No providers available yet.</p>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}