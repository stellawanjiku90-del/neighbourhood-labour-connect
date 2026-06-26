import React, { useState, useRef, useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";
import { Search, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CategorySearch({
  value,
  onChange,
  multiple = false,
  selected = [],
  onToggle,
  placeholder = "Search service category…",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  // Multi-select mode
  if (multiple) {
    return (
      <div ref={ref} className="relative">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selected.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {s}
                <button
                  type="button"
                  onClick={() => onToggle(s)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="rounded-2xl h-12 pl-10"
          />
        </div>
        {open && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No matches found</p>
            ) : (
              filtered.map((c) => {
                const isSelected = selected.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      onToggle(c.name);
                      setQuery("");
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted text-left"
                  >
                    <span className="text-foreground">{c.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#2D7A3E]" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  // Single-select mode
  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query || value}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="rounded-2xl h-12 pl-10"
        />
        {value && !query && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No matches found</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  onChange(c.name);
                  setQuery("");
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted text-left ${
                  value === c.name ? "text-[#2D7A3E] font-medium" : "text-foreground"
                }`}
              >
                {c.name}
                {value === c.name && <Check className="w-4 h-4 text-[#2D7A3E]" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}