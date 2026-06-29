import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { hashPin } from "@/lib/pin";
import { useAuth } from "@/lib/AuthContext";
import PushNotificationEnabler from "@/components/PushNotificationEnabler";
import PageHeader from "@/components/PageHeader";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  User, Bell, KeyRound, CreditCard, Gift, LogOut, Trash2,
  ChevronRight, Shield, Loader2, Pencil, HelpCircle, MessageSquare, FileText, Info,
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

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

  const menu = [
    {
      group: "Account",
      items: [
        { icon: Pencil, label: "Edit Profile", to: "/settings" },
        { icon: Gift, label: "Refer & Earn", to: "/referrals" },
        { icon: CreditCard, label: "Subscription & Payment", to: "/subscribe" },
        { icon: KeyRound, label: "Change PIN", onClick: () => setPinOpen(true) },
        ...(user?.role === "admin" ? [{ icon: Shield, label: "Admin Panel", to: "/admin" }] : []),
      ],
    },
    {
      group: "Support",
      items: [
        { icon: HelpCircle, label: "Help & Support", href: "https://wa.me/254706692111?text=Hi%20NLC%20Support%2C%20I%20have%20a%20question%20about%20my%20account" },
        { icon: MessageSquare, label: "Contact Us", href: "https://wa.me/254706692111" },
      ],
    },
    {
      group: "Legal",
      items: [
        { icon: FileText, label: "Terms of Service", to: "/terms" },
        { icon: FileText, label: "Privacy Policy", to: "/privacy" },
        { icon: FileText, label: "Refund Policy", to: "/refund" },
      ],
    },
    {
      group: "About",
      items: [
        { icon: Info, label: "About Neighbourhood Labour Connect", desc: "Connecting customers with trusted local service providers in Kenya. Version 1.0" },
      ],
    },
  ];



  return (
    <div className="h-full flex flex-col overflow-hidden max-w-2xl mx-auto w-full">
      <PageHeader title="Settings" subtitle="Manage your account" icon={User} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5">
        {/* Profile card */}
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3.5">
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
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          </div>
          <PushNotificationEnabler />
        </div>

        {/* Menu groups */}
        {menu.map((g) => (
          <div key={g.group}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{g.group}</p>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {g.items.map((item, i) => {
                const Ico = item.icon;
                const hasDesc = !!item.desc;
                const inner = (
                  <>
                    <span className={`${hasDesc ? "self-start mt-2.5" : ""} w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0`}>
                      <Ico className="w-5 h-5 text-accent-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      {item.desc && <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>}
                    </div>
                    {item.onClick || item.to || item.href ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" /> : null}
                  </>
                );
                const cls = `w-full flex items-center gap-3 px-4 ${hasDesc ? "py-3" : "h-14"} ${i < g.items.length - 1 ? "border-b border-border" : ""} hover:bg-muted transition-colors text-left`;
                return item.href ? (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
                ) : item.onClick ? (
                  <button key={item.label} onClick={item.onClick} className={cls}>{inner}</button>
                ) : !item.to ? (
                  <div key={item.label} className={cls}>{inner}</div>
                ) : (
                  <button key={item.label} onClick={() => navigate(item.to)} className={cls}>{inner}</button>
                );
              })}
            </div>
          </div>
        ))}

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