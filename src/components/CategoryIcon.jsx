import React from "react";
import {
  Sparkles, Home, Baby, Car, Truck, Package, PackageOpen, Zap, Wrench,
  Hammer, PaintRoller, Tv, Wifi, Cctv, GraduationCap, PenLine, Languages,
  Code, Palette, Scissors, Hand, Sparkle, HeartHandshake, Flower2, Shield,
  PartyPopper, Blocks, Briefcase,
} from "lucide-react";

const MAP = {
  Sparkles, Home, Baby, Car, Truck, Package, PackageOpen, Zap, Wrench,
  Hammer, PaintRoller, Tv, Wifi, Cctv, GraduationCap, PenLine, Languages,
  Code, Palette, Scissors, Hand, Sparkle, HeartHandshake, Flower2, Shield,
  PartyPopper, Blocks,
};

export default function CategoryIcon({ name, className = "w-5 h-5" }) {
  const Icon = MAP[name] || Briefcase;
  return <Icon className={className} />;
}