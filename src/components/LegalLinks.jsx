import React from "react";
import { Link } from "react-router-dom";

export default function LegalLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-4 text-[11px] text-muted-foreground">
      <Link to="/terms" className="hover:underline">Terms of Service</Link>
      <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
      <Link to="/refund" className="hover:underline">Refund Policy</Link>
    </div>
  );
}