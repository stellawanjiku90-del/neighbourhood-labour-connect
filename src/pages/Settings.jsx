import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
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
    <div className="h-[100dvh] flex flex-col overflow-hidden max-w-2xl mx-auto">
      {/* Compact header */}
      <header className="shrink-0 px-4 md:px-8 py-3 border-b border-slate-100 bg-background">
        <h1 className="text-lg font-extrabold text-foreground">Settings</h1>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-3">
        <div className="space-y-3">
          {/* Profile card */}
          <div className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-lg shrink-0">
              {user?.full_name?.[0] || <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{user?.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <PushNotificationEnabler />

          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full rounded-xl h-11 gap-2 text-destructive border-destructive/30 text-sm"
          >
            <LogOut className="w-4 h-4" /> Log out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full rounded-xl h-11 gap-2 text-destructive border-destructive/30 text-sm">
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
  );
}