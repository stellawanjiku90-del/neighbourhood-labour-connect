import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { signOutFirebase } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Phone, ShieldCheck, User } from "lucide-react";

const LOGO_URL =
  "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function FirebaseApp() {
  // The Firebase user object is the source of truth for this session.
  const { user, loading } = useFirebaseAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOutFirebase();
    navigate("/firebase-auth");
  };

  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 h-20 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <img
            src={LOGO_URL}
            alt="Neighbourhood Labour Connect"
            className="w-9 h-9 rounded-full object-cover"
          />
          <span className="font-extrabold text-foreground">Neighbourhood Labour Connect</span>
        </div>
        <Button onClick={handleSignOut} variant="outline" className="rounded-xl">
          <LogOut className="w-4 h-4 mr-1" /> Sign Out
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground">You're signed in via phone verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm bg-muted rounded-xl px-4 py-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{user.phoneNumber}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <User className="w-6 h-6 text-[#2D7A3E] mb-3" />
            <h2 className="font-bold text-foreground mb-1">Your Account</h2>
            <p className="text-sm text-muted-foreground">
              Manage your profile, services, and preferences from your secure dashboard.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <ShieldCheck className="w-6 h-6 text-[#2D7A3E] mb-3" />
            <h2 className="font-bold text-foreground mb-1">Phone-Verified</h2>
            <p className="text-sm text-muted-foreground">
              Your session is secured by Firebase phone authentication.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}