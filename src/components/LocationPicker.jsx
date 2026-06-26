import React, { useState } from "react";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, LocateFixed, Loader2, Search } from "lucide-react";

export default function LocationPicker({ value, onChange }) {
  const { detect, search, loading } = useGeoLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleDetect = async () => {
    const loc = await detect();
    if (loc) {
      onChange(loc);
      setResults([]);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    setResults(await search(query));
    setSearching(false);
  };

  return (
    <div className="space-y-3">
      {value?.location_name && (
        <div className="flex items-start gap-2 bg-secondary rounded-2xl p-3 text-secondary-foreground">
          <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{value.location_name}</span>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={handleDetect}
        disabled={loading}
        className="w-full rounded-2xl h-12 justify-start gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
        Use my current location
      </Button>

      <div className="flex gap-2">
        <Input
          placeholder="Search any place worldwide…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          className="rounded-2xl h-12"
        />
        <Button type="button" onClick={handleSearch} disabled={searching} className="rounded-2xl h-12 px-4 bg-[#1A1F2E]">
          {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange(r);
                setResults([]);
                setQuery("");
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-muted flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
              <span className="line-clamp-2">{r.location_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}