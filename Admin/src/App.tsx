import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css'
import Sidebar from './component/Sidebar/sidebar'
import Topbar from './component/Topbar/topbar'
import AppRoutes from './routes/AppRoutes';
import { useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { attemptTokenRefreshOnLoad, getAccessToken } from './api/request';

function AppContent() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { restoreSession, adminUser } = useAuth();
  useLanguage();

  // ✅ Define auth routes where layout should be hidden
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authRoutes.includes(location.pathname);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Try to refresh the access token from the httpOnly cookie
      await attemptTokenRefreshOnLoad();

      const token = getAccessToken();

      if (token) {
        // Valid session — restore user data from the server (not localStorage!)
        await restoreSession();
      }

      if (!cancelled) {
        setSessionReady(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [restoreSession]);

  useEffect(() => {
    if (!sessionReady) return;

    const token = getAccessToken();
    const isLoggedIn = Boolean(token && adminUser);

    if (isAuthPage && isLoggedIn) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!isAuthPage && !isLoggedIn) {
      navigate("/login", { replace: true });
      return;
    }

    // ✅ Update active menu based on current route
    const path = location.pathname;
    if (path.startsWith("/teams")) {
      setActive("teams");
    } else if (path.startsWith("/dashboard")) {
      setActive("dashboard");
    } else if (path.startsWith("/masters")) {
      setActive("masters");
    } else if (path.startsWith("/plans")) {
      setActive("plans");
    } else if (path.startsWith("/users")) {
      setActive("users");
    } else if (path.startsWith("/events")) {
      setActive("events");
    } else if (path.startsWith("/request")) {
      setActive("request");
    } else if (path.startsWith("/facility")) {
      setActive("facility");
    } else if (path.startsWith("/eval")) {
      setActive("eval");
    } else if (path.startsWith("/settings")) {
      setActive("settings");
    } else if (path.startsWith("/help")) {
      setActive("help");
    } else if (path.startsWith("/cms")) {
      setActive("cms");
    }
  }, [location.pathname, isAuthPage, sessionReady, adminUser, navigate]);

  if (!sessionReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm font-medium text-secondary/60">Loading...</p>
        </div>
      </div>
    );
  }

  const token = getAccessToken();
  const isLoggedIn = Boolean(token && adminUser);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      {isAuthPage || !isLoggedIn ? (
        // ✅ Auth pages — no Sidebar or Topbar, just the form
        <AppRoutes />
      ) : (
        // ✅ Normal pages — full layout with Sidebar & Topbar
        <div className="flex h-screen overflow-hidden">
          <Sidebar active={active} setActive={setActive} open={sidebarOpen} setOpen={setSidebarOpen} />
          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0 2xl:ms-72 lg:ms-64 transition-all duration-300">
            <Topbar setOpen={setSidebarOpen} />
            <main className="relative flex-1 overflow-auto px-4 2xl:px-6 py-4">
              <AppRoutes />
            </main>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
