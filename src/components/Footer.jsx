import React from "react";
import { Link } from "react-router-dom";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white mt-8">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-2 mb-4">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-extrabold text-foreground">Neighbourhood Labour Connect</span>
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