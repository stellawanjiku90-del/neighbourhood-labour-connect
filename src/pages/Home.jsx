import React from "react";
import { useAuth } from "@/lib/AuthContext";
import CustomerDashboard from "@/components/dashboards/CustomerDashboard";
import ProviderDashboard from "@/components/dashboards/ProviderDashboard";
import LandingPage from "@/components/LandingPage";
import LocationGate from "@/components/LocationGate";

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return <LocationGate><LandingPage /></LocationGate>;
  }

  return user.role === "provider" ? <ProviderDashboard /> : <CustomerDashboard />;
}