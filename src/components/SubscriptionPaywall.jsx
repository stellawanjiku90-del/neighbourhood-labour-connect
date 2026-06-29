import { Link } from "react-router-dom";
import { Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionPaywall({ message }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-10">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-secondary-foreground" />
      </div>
      <h2 className="text-xl font-extrabold text-foreground mb-2">Subscription Required</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {message || (
          <>
            Subscribe for just <span className="font-bold text-foreground">$1/month</span> to view profiles and chat with service providers.
          </>
        )}
      </p>
      <Button asChild className="rounded-xl h-12 bg-[#2D7A3E] hover:bg-[#246332]">
        <Link to="/subscribe">
          <CreditCard className="w-4 h-4 mr-2" /> Subscribe Now
        </Link>
      </Button>
    </div>
  );
}