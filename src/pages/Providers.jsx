import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { distanceKm } from "@/lib/categories";
import CategorySearch from "@/components/CategorySearch";
import ProviderCard from "@/components/ProviderCard";
import LocationPicker from "@/components/LocationPicker";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionPaywall from "@/components/SubscriptionPaywall";

export default function Providers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const [category, setCategory] = useState(params.get("category") || "All");
  const [providers, setProviders] = useState([]);
  const [loc, setLoc] = useState(null);
  const [sort, setSort] = useState("distance");
  const { active, loading: subLoading } = useSubscription();

  useEffect(() => {
    apiClient.entities.ServiceProvider.filter({ available: true }, "-rating", 50).then(setProviders);
  }, []);

  const list = useMemo(() => {
    let items = providers
      .filter((p) => category === "All" || (p.professions || []).includes(category))
      .map((p) => ({
        ...p,
        _dist: loc ? distanceKm(loc.lat, loc.lng, p.lat, p.lng) : null,
      }));
    if (sort === "distance" && loc) {
      items.sort((a, b) => (a._dist ?? 1e9) - (b._dist ?? 1e9));
    } else {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return items;
  }, [providers, category, loc, sort]);

  if (user?.role === "provider") {
    return <Navigate to="/jobs" replace />;
  }
  if (!subLoading && !active) {
    return <SubscriptionPaywall />;
  }
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 px-4 py-2.5 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-foreground">Find Help</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/post")} className="rounded-lg h-9 px-3 text-sm">
              <Plus className="w-4 h-4 mr-1" /> Post a Job
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className={`rounded-lg h-9 px-3 text-sm ${loc ? "bg-primary text-primary-foreground border-primary" : ""}`}>
                  <MapPin className="w-4 h-4 mr-1" /> {loc ? "Custom" : "Location"}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>Search location</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <LocationPicker value={loc} onChange={setLoc} />
                  {loc && (
                    <Button
                      variant="outline"
                      onClick={() => setLoc(null)}
                      className="w-full mt-3 rounded-lg h-10 text-destructive border-destructive/30"
                    >
                      Clear location
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <CategorySearch
          value={category === "All" ? "" : category}
          onChange={(v) => setCategory(v || "All")}
          placeholder="Search service category…"
        />
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-muted-foreground">{list.length} providers</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button onClick={() => setSort("distance")} className={sort === "distance" ? "font-semibold text-foreground" : ""}>
              Nearest
            </button>
            <span>·</span>
            <button onClick={() => setSort("rating")} className={sort === "rating" ? "font-semibold text-foreground" : ""}>
              Top rated
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto page-content py-4">
        <div className="flex gap-3 pb-2 h-full max-w-2xl mx-auto w-full">
          {list.map((p) => (
            <div key={p.id} className="min-w-[180px] shrink-0">
              <ProviderCard provider={p} distance={p._dist} compact />
            </div>
          ))}
        </div>
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No providers found</p>
        )}
      </div>
    </div>
  );
}