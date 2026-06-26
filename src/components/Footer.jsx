import React from "react";
import { Link } from "react-router-dom";
import { HandHelping } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white mt-8">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#2D7A3E] flex items-center justify-center">
            <HandHelping className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-foreground">Labour Connect</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/refund" className="hover:text-foreground">Refund Policy</Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} Neighbourhood Labour Connect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}