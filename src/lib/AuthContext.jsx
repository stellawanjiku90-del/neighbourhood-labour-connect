import { createContext, useState, useContext, useEffect } from "react";
import { apiClient, TOKEN_KEY } from "@/api/apiClient";

const AuthContext = createContext();
const buildUserFromProfile = (profile, fallbackId) => ({
  id: profile?.firebase_uid || fallbackId || profile?.phone,
  full_name: profile ? `${profile.first_name || ""} ${profile.surname || ""}`.trim() || profile.phone : profile?.phone,
  phone: profile?.phone,
  role: profile?.role || "customer",
  profile,
  profile_completed: !!profile?.profile_completed,
});

export const AuthProvider = ({ children }) => {
  const [user,setUser]=useState(null); const [isAuthenticated,setIsAuthenticated]=useState(false);
  const [isLoadingAuth,setIsLoadingAuth]=useState(true); const [isLoadingPublicSettings,setIsLoadingPublicSettings]=useState(true);
  const [authError,setAuthError]=useState(null); const [authChecked,setAuthChecked]=useState(false); const [appPublicSettings,setAppPublicSettings]=useState(null);

  useEffect(()=>{ (async()=>{
    try { const settings=await fetch('/api/config/public').then(r=>r.json()); setAppPublicSettings(settings); }
    catch { setAppPublicSettings({}); }
    finally { setIsLoadingPublicSettings(false); }
    try { const me=await apiClient.auth.me(); setUser(me); setIsAuthenticated(true); }
    catch { setUser(null); setIsAuthenticated(false); }
    finally { setIsLoadingAuth(false); setAuthChecked(true); }
  })(); },[]);

  const setPinSession = async (profile) => {
    if(!profile) return;
    try {
      const result=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:profile.phone,pin_hash:profile.pin_hash})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);return d;});
      if(result.access_token) localStorage.setItem(TOKEN_KEY,result.access_token);
      const next=result.user||buildUserFromProfile(profile,profile.firebase_uid); setUser(next); setIsAuthenticated(true);
    } catch { const next=buildUserFromProfile(profile,profile.firebase_uid); setUser(next); setIsAuthenticated(true); }
  };
  const logout=async(shouldRedirect=true)=>{ localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem('pin_verified'); sessionStorage.removeItem('pin_session_profile'); setUser(null); setIsAuthenticated(false); if(shouldRedirect) window.location.href='/auth'; };
  const navigateToLogin=()=>{window.location.href='/auth';};
  return <AuthContext.Provider value={{user,isAuthenticated,isLoadingAuth,isLoadingPublicSettings,authError,appPublicSettings,authChecked,logout,navigateToLogin,setPinSession}}>{children}</AuthContext.Provider>;
};
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('useAuth must be used within an AuthProvider');return c;};
