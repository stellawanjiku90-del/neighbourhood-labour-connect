import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Providers from '@/pages/Providers';
import ProviderDetail from '@/pages/ProviderDetail';
import PostJob from '@/pages/PostJob';
import MyJobs from '@/pages/MyJobs';
import Settings from '@/pages/Settings';
import BecomeProvider from '@/pages/BecomeProvider';
import Messages from '@/pages/Messages';
import Chat from '@/pages/Chat';
import PageTransition from '@/components/PageTransition';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Refund from '@/pages/Refund';
import AdminPanel from '@/pages/AdminPanel';
import FirebaseAuth from '@/pages/FirebaseAuth';
import FirebaseRouteGuard from '@/components/FirebaseRouteGuard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/firebase-auth" element={<FirebaseAuth />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route element={<FirebaseRouteGuard />}>
          <Route path="/providers" element={<Providers />} />
          <Route path="/post" element={<PostJob />} />
          <Route path="/jobs" element={<MyJobs />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Route>
      <Route element={<FirebaseRouteGuard />}>
        <Route path="/provider/:id" element={<PageTransition><ProviderDetail /></PageTransition>} />
        <Route path="/become-provider" element={<PageTransition><BecomeProvider /></PageTransition>} />
        <Route path="/chat/:id" element={<PageTransition><Chat /></PageTransition>} />
      </Route>
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/refund" element={<Refund />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function useAutoTheme() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
}

function App() {
  useAutoTheme();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App