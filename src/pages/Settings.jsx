import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, User, HandHelping } from "lucide-react";
import { Link } from "react-router-dom";
import PushNotificationEnabler from "@/components/PushNotificationEnabler";
import { useAuth } from "@/lib/AuthContext";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      await logout();
    } catch (e) {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto px-4 md:px-8 py-4 md:py-6">
      <h1 className="text-2xl font-extrabold text-foreground mb-4 shrink-0">Settings</h1>

      <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 mb-3">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xl">
          {user?.full_name?.[0] || <User className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground truncate">{user?.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      <PushNotificationEnabler />

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        <Link to="/become-provider" className="flex items-center gap-3 px-5 py-4 hover:bg-muted">
          <HandHelping className="w-5 h-5 text-[#2D7A3E]" />
          <span className="font-medium">Become a service provider</span>
        </Link>
      </div>

      <Button
        onClick={() => base44.auth.logout()}
        variant="outline"
        className="w-full mt-4 rounded-2xl h-12 gap-2 text-destructive border-destructive/30"
      >
        <LogOut className="w-5 h-5" /> Log out
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full mt-2 rounded-2xl h-12 gap-2 text-destructive border-destructive/30">
            <Trash2 className="w-5 h-5" /> Delete Account
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
  );
}