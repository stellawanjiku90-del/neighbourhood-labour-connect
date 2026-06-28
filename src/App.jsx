import { useEffect, lazy, Suspense } from 'react';
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
import PageTransition from '@/components/PageTransition';
import FirebaseAuth from '@/pages/FirebaseAuth';
import FirebaseRouteGuard from '@/components/FirebaseRouteGuard';
import RoleGuard from '@/components/RoleGuard';

// Lazy-loaded routes for code splitting
const Providers = lazy(() => import('@/pages/Providers'));
const ProviderDetail = lazy(() => import('@/pages/ProviderDetail'));
const PostJob = lazy(() => import('@/pages/PostJob'));
const MyJobs = lazy(() => import('@/pages/MyJobs'));
const Settings = lazy(() => import('@/pages/Settings'));
const BecomeProvider = lazy(() => import('@/pages/BecomeProvider'));
const Messages = lazy(() => import('@/pages/Messages'));
const Chat = lazy(() => import('@/pages/Chat'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Refund = lazy(() => import('@/pages/Refund'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const Referrals = lazy(() => import('@/pages/Referrals'));
const Subscribe = lazy(() => import('@/pages/Subscribe'));
const Earnings = lazy(() => import('@/pages/Earnings'));

const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

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
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route element={<RoleGuard allow={["customer"]} />}>
            <Route path="/providers" element={<Providers />} />
            <Route path="/post" element={<PostJob />} />
            <Route path="/jobs" element={<MyJobs />} />
          </Route>
        </Route>
      </Route>
      <Route element={<FirebaseRouteGuard />}>
        <Route path="/chat/:id" element={<PageTransition><Chat /></PageTransition>} />
        <Route element={<RoleGuard allow={["customer"]} />}>
          <Route path="/provider/:id" element={<PageTransition><ProviderDetail /></PageTransition>} />
        </Route>
        <Route element={<RoleGuard allow={["provider"]} />}>
          <Route path="/become-provider" element={<PageTransition><BecomeProvider /></PageTransition>} />
        </Route>
      </Route>
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
          <Suspense fallback={<LoadingFallback />}>
            <AuthenticatedApp />
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App