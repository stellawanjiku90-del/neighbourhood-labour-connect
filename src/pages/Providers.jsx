import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CATEGORIES, distanceKm } from "@/lib/categories";
import CategorySearch from "@/components/CategorySearch";
import ProviderCard from "@/components/ProviderCard";
import LocationPicker from "@/components/LocationPicker";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, SlidersHorizontal } from "lucide-react";
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
    <PullToRefresh onRefresh={refresh}>
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Find Help</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-2xl gap-2">
              <MapPin className="w-4 h-4" /> Location
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Choose search location</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <LocationPicker value={loc} onChange={setLoc} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="mb-4">
        <CategorySearch
          value={category === "All" ? "" : category}
          onChange={(v) => setCategory(v || "All")}
          placeholder="Search category or leave blank for all…"
        />
      </div>

      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-muted-foreground">{list.length} providers</span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4" />
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

      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((p) => (
          <ProviderCard key={p.id} provider={p} distance={p._dist} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="text-muted-foreground text-sm mt-6 text-center">
          No providers found for this category.
        </p>
      )}
    </div>
    </PullToRefresh>
  );
}