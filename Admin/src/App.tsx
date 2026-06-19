import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css'
import Sidebar from './component/Sidebar/sidebar'
import Topbar from './component/Topbar/topbar'
import AppRoutes from './routes/AppRoutes';
import { useLanguage } from './context/LanguageContext';
import { Toaster } from 'react-hot-toast';

function App() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useLanguage();

  // ✅ Define auth routes where layout should be hidden
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authRoutes.includes(location.pathname);
  const isLoggedIn = Boolean(localStorage.getItem("adminToken"));

  useEffect(() => {
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
  }, [location.pathname, isAuthPage, isLoggedIn, navigate]);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      {isAuthPage ? (
        // ✅ Auth pages — no Sidebar or Topbar, just the form
        <AppRoutes />
      ) : (
        // ✅ Normal pages — full layout with Sidebar & Topbar
        // Using logical properties (ms-* = margin-inline-start, me-* = margin-inline-end)
        // These automatically flip in RTL mode
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
  )
}

export default App
