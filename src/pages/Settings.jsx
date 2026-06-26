import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield, HandHelping } from "lucide-react";
import { Link } from "react-router-dom";

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <h1 className="text-2xl font-extrabold text-foreground mb-6">Settings</h1>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xl">
          {user?.full_name?.[0] || <User className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground truncate">{user?.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        <Link to="/become-provider" className="flex items-center gap-3 px-5 py-4 hover:bg-muted">
          <HandHelping className="w-5 h-5 text-[#2D7A3E]" />
          <span className="font-medium">Become a service provider</span>
        </Link>
        <div className="flex items-center gap-3 px-5 py-4 text-muted-foreground">
          <Shield className="w-5 h-5" />
          <span>Verification & documents (coming soon)</span>
        </div>
      </div>

      <Button
        onClick={() => base44.auth.logout()}
        variant="outline"
        className="w-full mt-6 rounded-2xl h-12 gap-2 text-destructive border-destructive/30"
      >
        <LogOut className="w-5 h-5" /> Log out
      </Button>
    </div>
  );
}