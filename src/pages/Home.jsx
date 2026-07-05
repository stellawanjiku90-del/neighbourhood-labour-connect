import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import CustomerDashboard from "@/components/dashboards/CustomerDashboard";
import ProviderDashboard from "@/components/dashboards/ProviderDashboard";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const { user } = useAuth();
  usePresence();

  if (!user) {
    return <LandingPage />;
  }

  return user.role === "provider" ? <ProviderDashboard /> : <CustomerDashboard />;
}