import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Lightweight geolocation hook. Returns coords + reverse-geocoded label.
export function useGeoLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detect = useCallback(() => {
    return new Promise((resolve) => {
      setError(null);
      setLoading(true);

      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            let label = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await res.json();
              const a = data.address || {};
              label =
                [a.suburb || a.neighbourhood || a.city || a.town || a.village, a.state, a.country]
                  .filter(Boolean)
                  .join(", ") || label;
            } catch (e) {
              // keep coordinate label
            }
            setLoading(false);
            resolve({ lat: latitude, lng: longitude, location_name: label });
          },
          async (err) => {
            // Fallback to IP-based location
            try {
              const ipLocation = await base44.functions.invoke("getIpLocation", {});
              setLoading(false);
              resolve(ipLocation.data);
            } catch (e) {
              setError(err.message);
              setLoading(false);
              resolve(null);
            }
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
      } else {
        // No geolocation support - use IP-based fallback
        base44.functions.invoke("getIpLocation", {})
          .then((res) => {
            setLoading(false);
            resolve(res.data);
          })
          .catch((e) => {
            setError("Geolocation not supported");
            setLoading(false);
            resolve(null);
          });
      }
    });
  }, []);

  // Manual location search anywhere in the world
  const search = useCallback(async (query) => {
    if (!query) return [];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      return data.map((d) => ({
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        location_name: d.display_name,
      }));
    } catch (e) {
      return [];
    }
  }, []);

  return { detect, search, loading, error };
}