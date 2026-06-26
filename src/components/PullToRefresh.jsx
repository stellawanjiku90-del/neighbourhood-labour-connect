import { useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);

  const onTouchStart = (e) => {
    if (window.scrollY <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      active.current = true;
    }
  };

  const onTouchMove = (e) => {
    if (!active.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPull(Math.min(delta * 0.5, 100));
    }
  };

  const onTouchEnd = async () => {
    if (!active.current) return;
    active.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: active.current ? "none" : "transform 0.2s ease",
        }}
      >
        <div className="flex justify-center overflow-hidden" style={{ height: pull }}>
          {refreshing ? (
            <Loader2 className="w-5 h-5 text-[#2D7A3E] animate-spin mt-3" />
          ) : pull > 5 ? (
            <RefreshCw
              className={`w-5 h-5 text-[#2D7A3E] mt-3 transition-transform duration-200 ${
                pull >= THRESHOLD ? "rotate-180" : ""
              }`}
            />
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}