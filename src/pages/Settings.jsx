import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { hashPin } from "@/lib/pin";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import PushNotificationEnabler from "@/components/PushNotificationEnabler";
import PageHeader from "@/components/PageHeader";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  User, Bell, KeyRound, CreditCard, LogOut, Trash2,
  ChevronRight, Shield, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { active: subActive, loading: subLoading } = useSubscription();
  const [deleting, setDeleting] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  const needsProfileCompletion = !user?.profile_completed;
  const needsSubscription = !subLoading && !subActive;

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      await logout();
    } catch (e) {
      setDeleting(false);
    }
  };

  const changePin = async () => {
    if (!/^\d{4}$/.test(newPin)) {
      toast({ title: "PIN must be 4 digits", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "PINs don't match", variant: "destructive" });
      return;
    }
    setSavingPin(true);
    try {
      const pinHash = await hashPin(newPin);
      await base44.functions.invoke("saveUserProfile", {
        phone: user?.phone,
        pin_hash: pinHash,
      });
      toast({ title: "PIN changed", description: "Use your new PIN to log in." });
      setPinOpen(false);
      setNewPin("");
      setConfirmPin("");
    } catch (e) {
      toast({ title: "Could not change PIN", description: e.message, variant: "destructive" });
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Settings" subtitle="Manage your account" icon={User} />

      <div className="flex-1 min-h-0 overflow-y-auto page-content py-4">
        <div className="w-full space-y-5">
          {/* Setup reminders */}
          {needsProfileCompletion && (
            <div className="bg-warning-soft border border-warning/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-warning-soft-foreground shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-warning-soft-foreground">Complete Your Profile</p>
                <p className="text-xs text-warning-soft-foreground/80 mt-0.5">
                  Finish setting up your profile to start posting or finding jobs. You need to verify your identity first.
                </p>
                <Button
                  onClick={() => navigate("/firebase-auth")}
                  className="mt-2 h-8 text-xs rounded-lg bg-warning text-warning-foreground hover:bg-warning/90"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          )}

          {needsSubscription && !needsProfileCompletion && (
            <div className="bg-warning-soft border border-warning/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-warning-soft-foreground shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-warning-soft-foreground">Subscribe to Get Started</p>
                <p className="text-xs text-warning-soft-foreground/80 mt-0.5">
                  Your profile is ready! Subscribe for just $1/month to start posting or finding jobs.
                </p>
                <Button
                  onClick={() => navigate("/subscribe")}
                  className="mt-2 h-8 text-xs rounded-lg bg-warning text-warning-foreground hover:bg-warning/90"
                >
                  Subscribe Now
                </Button>
              </div>
            </div>
          )}

          {!needsProfileCompletion && !needsSubscription && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-primary">All Set!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your profile is complete and subscription is active. You're ready to go!
                </p>
              </div>
            </div>
          )}

          {/* Profile card */}
          <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3.5 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-accent-foreground font-extrabold text-xl shrink-0">
              {user?.full_name?.[0] || <User className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground truncate">{user?.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.phone || user?.email}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-accent px-2 py-0.5 rounded-full">
                {user?.role || "customer"}
              </span>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            </div>
            <PushNotificationEnabler />
          </div>

          {/* Account actions */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {[
              { icon: CreditCard, label: "Subscription & Billing", to: "/subscribe" },
              { icon: KeyRound, label: "Change PIN", onClick: () => setPinOpen(true) },
              ...(user?.role === "admin" ? [{ icon: Shield, label: "Admin Panel", to: "/admin" }] : []),
            ].map((item, i, arr) => {
              const Ico = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick || (() => navigate(item.to))}
                  className={`w-full flex items-center gap-3 px-4 h-14 text-left ${i < arr.length - 1 ? "border-b border-border" : ""} hover:bg-muted transition-colors`}
                >
                  <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <Ico className="w-5 h-5 text-accent-foreground" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Logout + Delete */}
          <div className="space-y-2.5">
            <Button
              onClick={() => logout()}
              variant="outline"
              className="w-full rounded-2xl h-12 gap-2 text-destructive border-destructive/30 text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" /> Log out
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-2xl h-12 gap-2 text-destructive border-destructive/30 text-sm font-semibold">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes your profile, jobs, conversations, and reviews. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Change PIN dialog */}
      <AlertDialog open={pinOpen} onOpenChange={setPinOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change your PIN</AlertDialogTitle>
            <AlertDialogDescription>Enter a new 4-digit login PIN.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-1">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="New PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.5em]"
            />
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingPin}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={changePin} disabled={savingPin}>
              {savingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}