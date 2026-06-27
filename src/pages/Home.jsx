import React from "react";
import { useAuth } from "@/lib/AuthContext";
import CustomerDashboard from "@/components/dashboards/CustomerDashboard";
import ProviderDashboard from "@/components/dashboards/ProviderDashboard";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return <LandingPage />;
  }

  const role = user?.profile?.role;
  return role === "provider" ? <ProviderDashboard /> : <CustomerDashboard />;
}