import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNavigationGuard } from "../../hooks/useNavigationGuard";
import { useTranslation } from "react-i18next";
import {
  AvtarImage,
  CloseIcon,
  LogoImage,
  MenuIcon,
} from "../../assets/images/images";
import { useAuthStore } from "../../store/store";
import {
  getNotifications,
  clearAllNotifications,
  getUnreadCount,
} from "../../api/notification.api";
import { getProfileImage } from "../../api/page.api";
import LanguageToggle from "./LanguageToggle";
import NavLinkItem from "./NavLinkItem";

function formatNotificationTime(dateStr: string, t: (key: string, options?: any) => string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return t("header.justNow");
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t("header.minAgo", { count: diffMin });
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t("header.hoursAgo", { count: diffHour });
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return t("header.daysAgo", { count: diffDay });
  return new Date(dateStr).toLocaleDateString();
}

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationActive, setNotificationActive] = useState(false);
  const [notifications, setNotifications] = useState<any>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [headerProfileImage, setHeaderProfileImage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, accessToken, token, removeAll } = useAuthStore();

  // Navigation guard to prevent rapid clicks and cancel pending requests
  const { navigateWithGuard, isNavigating } = useNavigationGuard();

  const isLoggedIn = Boolean(accessToken ?? token);

  const handleLogout = () => {
    if (isNavigating) return;
    removeAll();
    localStorage.removeItem("rememberMe");
    setNotificationActive(false);
    navigateWithGuard("logout", "/", { replace: true });
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unreadCount);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications(1, 10);
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.pagination.total);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const initTimer = setTimeout(() => {
      fetchUnreadCount();
    }, 0);
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [isLoggedIn, fetchUnreadCount]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getProfileImage().then((resp) => {
      if (resp.status && resp.data?.image) {
        setHeaderProfileImage(resp.data.image);
      }
    }).catch(() => { });
  }, [isLoggedIn]);

  const handleBellClick = () => {
    const willOpen = !notificationActive;
    setNotificationActive(willOpen);
    if (willOpen) {
      fetchNotifications();
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      fetchNotifications();
    }
  };

  const handleViewAllNotifications = () => {
    setNotificationActive(false);
    navigate("/profile?view=notifications");
  };

  // Handle body scroll lock when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("overflow-hidden", "touch-none");
    } else {
      document.body.classList.remove("overflow-hidden", "touch-none");
    }
    return () => {
      document.body.classList.remove("overflow-hidden", "touch-none");
    };
  }, [menuOpen]);

  // Smooth-scroll to a section by its href/id
  const setScrollToId = (href: string) => {
    const id = href.startsWith("/") ? href.slice(1) : href;
    if (!id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { label: `${t("Home")}`, href: "/" },
    { label: `${t("Sport Events")}`, href: "/sport-activity-list" },
    ...(isLoggedIn ? [{ label: `${t("Achievements")}`, href: "/achievement" }] : []),
    { label: `${t("Facilities")}`, href: "/facilities" },
    { label: `${t("Sponsors")}`, href: "/sponsors" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }

    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <header className="z-20 w-full absolute xl:top-6 top-4">
      <div
        className="max-w-341.5 w-full mx-auto md:px-7 px-4
"
      >
        <div className="md:rounded-3xl rounded-2xl bg-white/60 flex justify-between items-center gap-2 lg:ps-6 sm:ps-4 ps-3 lg:pe-2 sm:pe-4 pe-3 px-4 py-2">
          {/* Logo & Nav */}
          <div className="flex items-center lg:flex-1">
            <a href="/" className="flex items-center focus:outline-none">
              <img
                src={LogoImage}
                alt={t("alt.logo")}
                className="xl:h-8.5 md:h-8 sm:h-7 h-5 w-auto object-contain"
              />
            </a>

            {/* Overlay */}
            {menuOpen && (
              <div
                className="menu-overlay fixed bg-black/60 inset-0 z-30 transition duration-700"
                onClick={() => setMenuOpen(false)}
              />
            )}

            {/* Nav */}
            <nav
              className={`
                lg:flex-1 xl:mx-12 lg:mx-4 lg:justify-center justify-between
                lg:relative fixed z-20 lg:top-auto top-0 lg:p-0 inset-s-0
                lg:bg-transparent bg-primary500 lg:w-auto w-2xs
                transform ltr:lg:translate-x-[unset] rtl:lg:translate-x-[unset]
                ltr:-translate-x-full rtl:translate-x-full
                transition-transform duration-700 ease-in-out
                lg:h-auto h-full lg:items-center items-start lg:flex lg:opacity-100 nav-items
                ${menuOpen
                  ? "ltr:translate-x-0 rtl:translate-x-0! z-40 opacity-100"
                  : "ltr:-translate-x-full rtl:translate-x-full opacity-0"
                }
              `}
            >
              {menuOpen && (
                <button
                  className="lg:hidden absolute top-6 ltr:right-6 rtl:left-6"
                  onClick={() => setMenuOpen(false)}
                >
                  <img
                    src={CloseIcon}
                    className="w-4 h-4 object-contain"
                    alt={t("alt.close")}
                  />
                </button>
              )}

              <ul className="lg:h-auto h-screen lg:flex lg:flex-row xl:space-x-8 space-x-4 w-full p-6 lg:px-0! pb-0 pt-14 lg:pt-0 lg:w-auto lg:bg-transparent bg-[#FAF6F1] overflow-auto lg:overflow-visible">
                {navLinks.map((link) => (
                  <NavLinkItem
                    key={link.label}
                    {...link}
                    active={isLinkActive(link.href)}
                    disabled={isNavigating}
                    onClick={() => {
                      setMenuOpen(false);

                      if (link.href.startsWith("/")) {
                        navigateWithGuard(link.href, link.href);
                      } else {
                        navigateWithGuard(link.href, "/");
                        setScrollToId(link.href);
                      }
                    }}
                  />
                ))}
              </ul>
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center xl:gap-4 sm:gap-2 gap-1.5 relative">
            <LanguageToggle />

            {isLoggedIn ? (
              <div className="flex md:gap-3.5 sm:gap-2 gap-1 items-center bg-white rounded-2xl md:ps-5 ps-3">
                {/* Notification Bell */}
                <a
                  className="text-primary font-just font-bold md:text-lg text-sm m-auto flex items-center justify-center relative cursor-pointer transition-all duration-300 ease-initial group"
                  onClick={handleBellClick}
                >
                  <svg
                    className="xl:w-6 md:w-5 w-4 xl:h-6 md:h-5 h-4 object-contain"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.52992 14.394C2.31727 15.7471 3.268 16.6862 4.43205 17.1542C8.89481 18.9486 15.1052 18.9486 19.5679 17.1542C20.732 16.6862 21.6827 15.7471 21.4701 14.394C21.3394 13.5625 20.6932 12.8701 20.2144 12.194C19.5873 11.2975 19.525 10.3197 19.5249 9.27941C19.5249 5.2591 16.1559 2 12 2C7.84413 2 4.47513 5.2591 4.47513 9.27941C4.47503 10.3197 4.41272 11.2975 3.78561 12.194C3.30684 12.8701 2.66061 13.5625 2.52992 14.394Z"
                      stroke="#161616"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 21C9.79613 21.6219 10.8475 22 12 22C13.1525 22 14.2039 21.6219 15 21"
                      stroke="#7A2530"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -end-2 min-w-4 h-4 rounded-full bg-primary text-white text-[10px]/none flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </a>

                {notificationActive && (
                  <div className="absolute top-[calc(100%+12px)] lg:end-19 end-0 z-50 md:w-95 w-[calc(100vw-32px)] rounded-3xl bg-white border border-primary/10 shadow-[0_24px_80px_rgba(10,34,64,0.18)] overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 bg-red-light">
                      <div>
                        <h3 className="text-secondary text-lg/tight font-bold">{t("notifications.title")}</h3>
                        <p className="text-secondary/55 text-xs font-semibold">{t("notifications.subtitle")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-primary text-xs font-bold underline underline-offset-4 cursor-pointer disabled:opacity-40"
                        disabled={notifications.length === 0}
                      >
                        {t("notifications.clearAll")}
                      </button>
                    </div>

                    <div className="max-h-82 overflow-auto p-3">
                      {loading ? (
                        <div className="py-8 text-center text-secondary/60 text-sm font-semibold">
                          {t("header.loading")}
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.slice(0, 3).map((item: any, index: any) => (
                          <div
                            key={item.id}
                            className="notification-pop mb-2 last:mb-0 rounded-2xl bg-white border border-secondary/8 p-3 flex gap-3 items-start"
                            style={{ animationDelay: `${index * 90}ms` }}
                          >
                            <span className="notification-icon min-w-10 w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                              <NotificationTypeIcon />
                            </span>
                            <span className="block min-w-0">
                              <span className="flex items-start gap-2">
                                <strong className="text-secondary text-sm/tight font-bold line-clamp-1">{item.title}</strong>
                                {item.isRead === 0 && <span className="mt-1 min-w-2 w-2 h-2 rounded-full bg-primary" />}
                              </span>
                              <span className="mt-1 block text-secondary/60 text-xs/tight font-medium line-clamp-2">{item.message}</span>
                              <span className="mt-2 block text-primary text-[11px] font-bold">{formatNotificationTime(item.createdAt, t)}</span>
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-secondary/60 text-sm font-semibold">
                          {t("notifications.empty")}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleViewAllNotifications}
                      className="w-full bg-primary text-white py-3 text-sm font-bold cursor-pointer hover:bg-secondary transition-colors"
                    >
                      {t("notifications.viewAll")}
                    </button>
                  </div>
                )}

                {/* Divider */}
                <svg
                  className="h-4 min-h-4 min-w-0.5 block"
                  width="1"
                  height="17"
                  viewBox="0 0 1 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.5 0.5L0.499999 16.5"
                    stroke="#161616"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Avatar */}
                <img
                  src={headerProfileImage || user?.avatar || AvtarImage}
                  alt={t("alt.avatar")}
                  className="xl:min-w-15 xl:w-15 xl:h-15 md:min-w-11 md:w-11 md:h-11 min-w-8 w-8 h-8 rounded-xl object-cover cursor-pointer m-0.5 bg-white-light"
                  onClick={() => navigate("/profile")}
                />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group xl:min-w-10 md:min-w-9 min-w-8 xl:w-10 md:w-9 w-8 xl:h-10 md:h-9 h-8 rounded-xl text-primary hover:bg-primary hover:text-white flex items-center justify-center cursor-pointer transition-all duration-300"
                  aria-label={t("profile.logout")}
                  title={t("profile.logout")}
                >
                  <svg className="md:w-5 w-4 md:h-5 h-4 rtl:-scale-x-100" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 8V6C14 4.89543 13.1046 4 12 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H12C13.1046 20 14 19.1046 14 18V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M9 12H20M20 12C20 12 17 9.5 17 8M20 12C20 12 17 14.5 17 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="bg-white text-primary border border-white hover:border-primary hover:bg-primary hover:text-white rounded-2xl xl:min-h-15 md:min-h-11 min-h-9 md:px-5 px-3 font-bold md:text-base text-sm transition-all duration-300 cursor-pointer"
              >
                {t("login.submit")}
              </button>
            )}

            {/* Hamburger */}
            <button
              type="button"
              className="nav-button lg:hidden flex justify-end cursor-pointer md:min-w-5 min-w-4 md:w-5 w-4"
              onClick={() => setMenuOpen(true)}
            >
              <img
                src={MenuIcon}
                alt={t("alt.menu")}
                className="md:w-6 w-4 md:h-6 h-4 object-contain rtl:-scale-x-100"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

function NotificationTypeIcon() {
  return (
    <svg className="w-5 h-5" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M8 2V5M16 2V5M3.5 9H20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 8C4 5.79 5.79 4 8 4H16C18.21 4 20 5.79 20 8V17C20 19.21 18.21 21 16 21H8C5.79 21 4 19.21 4 17V8Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
