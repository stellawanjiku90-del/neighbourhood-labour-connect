import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CATEGORIES, distanceKm } from "@/lib/categories";
import CategorySearch from "@/components/CategorySearch";
import ProviderCard from "@/components/ProviderCard";
import LocationPicker from "@/components/LocationPicker";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

export default function Providers() {
  const params = new URLSearchParams(useLocation().search);
  const [category, setCategory] = useState(params.get("category") || "All");
  const [providers, setProviders] = useState([]);
  const [loc, setLoc] = useState(null);
  const [sort, setSort] = useState("distance");

  useEffect(() => {
    base44.entities.ServiceProvider.filter({ available: true }, "-rating", 50).then(setProviders);
  }, []);

  const refresh = async () => {
    const data = await base44.entities.ServiceProvider.filter({ available: true }, "-rating", 50);
    setProviders(data);
  };

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

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden max-w-5xl mx-auto">
      {/* Compact header */}
      <div className="shrink-0 px-4 md:px-8 py-2.5 border-b border-slate-100 bg-background">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-extrabold text-foreground">Find Help</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className={`rounded-xl gap-1.5 h-8 text-xs ${loc ? "bg-[#2D7A3E] text-white border-[#2D7A3E]" : ""}`}>
                <MapPin className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{loc ? "Custom" : "Location"}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Search location</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <LocationPicker value={loc} onChange={setLoc} />
                {loc && (
                  <Button
                    variant="outline"
                    onClick={() => { setLoc(null); }}
                    className="w-full mt-3 rounded-xl h-10 text-destructive border-destructive/30 text-sm"
                  >
                    Clear location
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <CategorySearch
          value={category === "All" ? "" : category}
          onChange={(v) => setCategory(v || "All")}
          placeholder="Search category…"
        />
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-muted-foreground">{list.length} providers</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <button
              onClick={() => setSort("distance")}
              className={sort === "distance" ? "font-semibold text-[#2D7A3E]" : ""}
            >
              Nearest
            </button>
            <span>·</span>
            <button
              onClick={() => setSort("rating")}
              className={sort === "rating" ? "font-semibold text-[#2D7A3E]" : ""}
            >
              Top rated
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scroll only - NO vertical scroll */}
      <div className="flex-1 min-h-0 overflow-x-auto px-4 py-2">
        <div className="flex gap-2 pb-1 h-full">
          {list.map((p) => (
            <div key={p.id} className="min-w-[200px] shrink-0">
              <ProviderCard provider={p} distance={p._dist} compact />
            </div>
          ))}
        </div>
        {list.length === 0 && (
          <p className="text-muted-foreground text-xs text-center py-4">No providers found</p>
        )}
      </div>
    </div>
  );
}