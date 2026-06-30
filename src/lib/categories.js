export const CATEGORIES = [
  // Home & Cleaning
  { name: "Cleaner", icon: "Sparkles" },
  { name: "Housekeeper", icon: "Home" },
  { name: "Laundry Service", icon: "Shirt" },
  { name: "Cook", icon: "ChefHat" },
  { name: "Caterer", icon: "Soup" },
  { name: "Gardener", icon: "Flower2" },
  { name: "Pest Control", icon: "Bug" },
  { name: "Pool Cleaner", icon: "Waves" },

  // Childcare & Pets
  { name: "Nanny", icon: "Baby" },
  { name: "Babysitter", icon: "Baby" },
  { name: "Pet Sitter", icon: "Dog" },
  { name: "Dog Walker", icon: "Dog" },

  // Transport & Logistics
  { name: "Driver", icon: "Car" },
  { name: "Truck Driver", icon: "Truck" },
  { name: "Motorbike Rider", icon: "Bike" },
  { name: "Delivery Rider", icon: "Bike" },
  { name: "Mover", icon: "Package" },
  { name: "Loader", icon: "PackageOpen" },
  { name: "Errand Runner", icon: "ShoppingBag" },

  // Trades & Repair
  { name: "Electrician", icon: "Zap" },
  { name: "Plumber", icon: "Wrench" },
  { name: "Mason", icon: "Blocks" },
  { name: "Carpenter", icon: "Hammer" },
  { name: "Painter", icon: "PaintRoller" },
  { name: "Welder", icon: "Flame" },
  { name: "Mechanic", icon: "Cog" },
  { name: "Tiler", icon: "Grid3x3" },
  { name: "Roofer", icon: "HardHat" },
  { name: "Handyman", icon: "Drill" },
  { name: "Appliance Repair", icon: "Plug" },
  { name: "Solar Installer", icon: "Sun" },

  // Tech & Digital
  { name: "TV Mounting Technician", icon: "Tv" },
  { name: "Internet Installer", icon: "Wifi" },
  { name: "CCTV Installer", icon: "Cctv" },
  { name: "Phone Repair Technician", icon: "Smartphone" },
  { name: "Computer Technician", icon: "Laptop" },
  { name: "Website Developer", icon: "Code" },
  { name: "Graphic Designer", icon: "Palette" },
  { name: "Social Media Manager", icon: "Share2" },
  { name: "Virtual Assistant", icon: "Headset" },
  { name: "Data Entry Clerk", icon: "Keyboard" },
  { name: "Photographer", icon: "Camera" },
  { name: "Videographer", icon: "Video" },

  // Professional
  { name: "Tutor", icon: "GraduationCap" },
  { name: "Writer", icon: "PenLine" },
  { name: "Translator", icon: "Languages" },
  { name: "Accountant", icon: "Calculator" },
  { name: "Lawyer", icon: "Scale" },

  // Beauty & Wellness
  { name: "Salonist", icon: "Scissors" },
  { name: "Barber", icon: "Scissors" },
  { name: "Hairdresser", icon: "Scissors" },
  { name: "Nail Technician", icon: "Hand" },
  { name: "Waxing Specialist", icon: "Sparkle" },
  { name: "Makeup Artist", icon: "Brush" },
  { name: "Beautician", icon: "Sparkles" },
  { name: "Massage Therapist", icon: "HeartHandshake" },
  { name: "Spa Therapist", icon: "Flower" },
  { name: "Fitness Trainer", icon: "Dumbbell" },
  { name: "Yoga Instructor", icon: "Activity" },

  // Care & Health
  { name: "Caregiver", icon: "Heart" },
  { name: "Elderly Carer", icon: "Heart" },
  { name: "Nurse", icon: "Stethoscope" },

  // Events & Hospitality
  { name: "Event Staff", icon: "PartyPopper" },
  { name: "Waiter", icon: "Utensils" },
  { name: "Bartender", icon: "Wine" },
  { name: "DJ", icon: "Disc3" },
  { name: "MC", icon: "Mic" },
  { name: "Decorator", icon: "PartyPopper" },

  // Security
  { name: "Security Guard", icon: "Shield" },
  { name: "Bouncer", icon: "ShieldAlert" },

  // Tailoring
  { name: "Tailor", icon: "Ruler" },

  // Companionship
  { name: "Escort", icon: "Heart" }
];

export const EMERGENCY_CATEGORIES = ["Electrician", "Plumber", "Security Guard"];

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