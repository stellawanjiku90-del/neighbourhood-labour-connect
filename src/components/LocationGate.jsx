import React, { useState, useEffect } from "react";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";

export default function LocationGate({ children }) {
  const { detect } = useGeoLocation();
  const [state, setState] = useState("asking"); // asking | loading | granted | denied

  useEffect(() => {
    // If the user already granted previously, we can check quickly
    setTimeout(async () => {
      const loc = await detect().catch(() => null);
      if (loc) {
        if (typeof window !== "undefined") {
          window.__NLC_LOCATION = loc;
        }
        setState("granted");
      }
    }, 0);
  }, []);

  const handleAllow = async () => {
    setState("loading");
    const loc = await detect().catch(() => null);
    if (loc) {
      if (typeof window !== "undefined") {
        window.__NLC_LOCATION = loc;
      }
      setState("granted");
    } else {
      setState("denied");
    }
  };

  if (state === "granted") {
    return children;
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-background px-4 text-center safe-area-inset">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
        {state === "loading" ? (
          <Loader2 className="w-7 h-7 text-[#2D7A3E] animate-spin" />
        ) : (
          <MapPin className="w-7 h-7 text-[#2D7A3E]" />
        )}
      </div>
      <h2 className="text-lg font-extrabold text-foreground mb-2">Enable your location</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        Neighbourhood Labour Connect needs your location to find nearby help and jobs. We never share or store your precise location without your consent.
      </p>
      {state === "denied" && (
        <p className="text-xs text-destructive mb-4">
          Location access is blocked. Please allow it in your browser settings, then reload the app.
        </p>
      )}
      <Button onClick={handleAllow} disabled={state === "loading"} className="rounded-xl h-12 px-8 bg-[#1A1F2E] hover:bg-[#2A2F45] w-full max-w-xs">
        {state === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Allow location to continue"}
      </Button>
      {state === "denied" && (
        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl h-11 px-6 mt-3 w-full max-w-xs">
          Reload the app
        </Button>
      )}
    </div>
  );
}