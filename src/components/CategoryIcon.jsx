import React from "react";
import {
  Sparkles, Home, Baby, Car, Truck, Package, PackageOpen, Zap, Wrench,
  Hammer, PaintRoller, Tv, Wifi, Cctv, GraduationCap, PenLine, Languages,
  Code, Palette, Scissors, Hand, Sparkle, HeartHandshake, Flower2, Shield,
  PartyPopper, Blocks, Briefcase, Shirt, ChefHat, Soup, Bug, Waves, Dog,
  Bike, ShoppingBag, Flame, Cog, Grid3x3, HardHat, Drill, Plug, Sun,
  Smartphone, Laptop, Share2, Headset, Keyboard, Camera, Video, Calculator,
  Scale, Brush, Flower, Dumbbell, Activity, Heart, Stethoscope, Utensils,
  Wine, Disc3, Mic, ShieldAlert, Ruler,
} from "lucide-react";

const MAP = {
  Sparkles, Home, Baby, Car, Truck, Package, PackageOpen, Zap, Wrench,
  Hammer, PaintRoller, Tv, Wifi, Cctv, GraduationCap, PenLine, Languages,
  Code, Palette, Scissors, Hand, Sparkle, HeartHandshake, Flower2, Shield,
  PartyPopper, Blocks, Shirt, ChefHat, Soup, Bug, Waves, Dog, Bike,
  ShoppingBag, Flame, Cog, Grid3x3, HardHat, Drill, Plug, Sun, Smartphone,
  Laptop, Share2, Headset, Keyboard, Camera, Video, Calculator, Scale,
  Brush, Flower, Dumbbell, Activity, Heart, Stethoscope, Utensils, Wine,
  Disc3, Mic, ShieldAlert, Ruler,
};

export default function CategoryIcon({ name, className = "w-5 h-5" }) {
  const Icon = MAP[name] || Briefcase;
  return <Icon className={className} />;
}