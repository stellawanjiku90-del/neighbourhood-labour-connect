import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NavigationArrows() {
  const navigate = useNavigate();

  const handleBack = () => navigate(-1);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  );
}