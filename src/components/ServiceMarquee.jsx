import React from "react";

/**
 * A horizontally-scrolling marquee of service photos that moves right-to-left.
 * Content is duplicated so the loop is seamless. Pauses on hover.
 */
export default function ServiceMarquee({ services, speed = 45 }) {
  const items = [...services, ...services];

  return (
    <div className="relative overflow-hidden">
      {/* Edge fade masks for a premium feel */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 md:w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 md:w-16 bg-gradient-to-l from-background to-transparent z-10" />

      <div
        className="flex gap-3 md:gap-4 w-max animate-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map((s, i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0 w-32 h-40 md:w-44 md:h-52 group"
          >
            <img
              src={s.img}
              alt={s.label}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-2 md:p-3">
              <span className="inline-block bg-white/95 text-foreground text-[11px] md:text-sm font-semibold px-2.5 py-1 rounded-full">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}