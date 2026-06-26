export const CATEGORIES = [
  { name: "Cleaners", icon: "Sparkles" },
  { name: "Housekeepers", icon: "Home" },
  { name: "Nannies", icon: "Baby" },
  { name: "Drivers", icon: "Car" },
  { name: "Truck Drivers", icon: "Truck" },
  { name: "Movers", icon: "Package" },
  { name: "Loaders", icon: "PackageOpen" },
  { name: "Electricians", icon: "Zap" },
  { name: "Plumbers", icon: "Wrench" },
  { name: "Masons", icon: "Blocks" },
  { name: "Carpenters", icon: "Hammer" },
  { name: "Painters", icon: "PaintRoller" },
  { name: "TV Mounting Technicians", icon: "Tv" },
  { name: "Internet Installers", icon: "Wifi" },
  { name: "CCTV Installers", icon: "Cctv" },
  { name: "Tutors", icon: "GraduationCap" },
  { name: "Writers", icon: "PenLine" },
  { name: "Translators", icon: "Languages" },
  { name: "Website Developers", icon: "Code" },
  { name: "Graphic Designers", icon: "Palette" },
  { name: "Salonists", icon: "Scissors" },
  { name: "Barbers", icon: "Scissors" },
  { name: "Nail Technicians", icon: "Hand" },
  { name: "Waxing Specialists", icon: "Sparkle" },
  { name: "Massage Therapists", icon: "HeartHandshake" },
  { name: "Gardeners", icon: "Flower2" },
  { name: "Security Guards", icon: "Shield" },
  { name: "Event Staff", icon: "PartyPopper" }
];

export const EMERGENCY_CATEGORIES = ["Electricians", "Plumbers", "Security Guards"];

// Haversine distance in km
export function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}